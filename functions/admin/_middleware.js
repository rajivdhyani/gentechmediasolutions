// Guards every /admin route. Cloudflare Access sits in front of these paths and
// injects a signed JWT; we verify it here too so the data stays protected even if
// the Access policy is ever removed or misconfigured.

function base64UrlDecode(value) {
	const padding = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4));
	const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/') + padding);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

function decodeJson(value) {
	return JSON.parse(new TextDecoder().decode(base64UrlDecode(value)));
}

function deny(message, status = 403) {
	return new Response(message, { status, headers: { 'content-type': 'text/plain' } });
}

async function verifyAccessJwt(token, teamDomain, aud) {
	const parts = token.split('.');
	if (parts.length !== 3) return null;
	const [headerB64, payloadB64, signatureB64] = parts;

	const header = decodeJson(headerB64);
	if (header.alg !== 'RS256') return null;

	const certs = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`, {
		cf: { cacheTtl: 3600, cacheEverything: true },
	}).then((res) => (res.ok ? res.json() : null));
	if (!certs?.keys) return null;

	const jwk = certs.keys.find((key) => key.kid === header.kid);
	if (!jwk) return null;

	const key = await crypto.subtle.importKey(
		'jwk',
		jwk,
		{ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
		false,
		['verify']
	);

	const valid = await crypto.subtle.verify(
		'RSASSA-PKCS1-v1_5',
		key,
		base64UrlDecode(signatureB64),
		new TextEncoder().encode(`${headerB64}.${payloadB64}`)
	);
	if (!valid) return null;

	const claims = decodeJson(payloadB64);
	const now = Math.floor(Date.now() / 1000);
	const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];

	if (!audience.includes(aud)) return null;
	if (claims.iss !== `https://${teamDomain}`) return null;
	if (typeof claims.exp !== 'number' || claims.exp <= now) return null;
	if (typeof claims.nbf === 'number' && claims.nbf > now) return null;

	return claims;
}

export async function onRequest(context) {
	const { request, env, next } = context;
	const teamDomain = env.ACCESS_TEAM_DOMAIN;
	const aud = env.ACCESS_AUD;

	if (!teamDomain || !aud) {
		return deny(
			'Admin area is not configured yet. Set ACCESS_TEAM_DOMAIN and ACCESS_AUD, and put a Cloudflare Access application in front of /admin.',
			503
		);
	}

	const token =
		request.headers.get('Cf-Access-Jwt-Assertion') ??
		(request.headers.get('cookie') ?? '').match(/CF_Authorization=([^;]+)/)?.[1];

	if (!token) return deny('Not authenticated.', 401);

	const claims = await verifyAccessJwt(token, teamDomain, aud);
	if (!claims) return deny('Not authorised.', 403);

	context.data.adminEmail = claims.email ?? 'unknown';
	return next();
}
