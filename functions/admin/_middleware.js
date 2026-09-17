import { SESSION_COOKIE, hashToken, readCookie, storedPasswordHash } from './auth.js';

// Paths that must stay reachable without a session, or nobody could ever log in
// or complete first-time setup. The setup endpoint guards itself.
const PUBLIC_PATHS = new Set([
	'/admin/login',
	'/admin/login/',
	'/admin/api/login',
	'/admin/setup',
	'/admin/setup/',
	'/admin/api/setup',
]);

export async function onRequest(context) {
	const { request, env, next } = context;
	const { pathname } = new URL(request.url);

	if (PUBLIC_PATHS.has(pathname)) return next();

	if (!(await storedPasswordHash(env))) {
		return new Response(
			'Admin area is not configured yet. Open /admin/setup with your setup link to choose a password.',
			{ status: 503, headers: { 'content-type': 'text/plain' } }
		);
	}

	const token = readCookie(request, SESSION_COOKIE);
	let valid = false;

	if (token) {
		const row = await env.DB.prepare(
			"SELECT token_hash FROM admin_sessions WHERE token_hash = ? AND expires_at > datetime('now')"
		)
			.bind(await hashToken(token))
			.first();
		valid = Boolean(row);
	}

	if (!valid) {
		// A browser navigation should land on the login form; fetch() calls need a 401
		// so the dashboard can react rather than parsing an HTML page as JSON.
		if (request.headers.get('accept')?.includes('text/html')) {
			return Response.redirect(new URL('/admin/login', request.url).toString(), 302);
		}
		return new Response(JSON.stringify({ error: 'Not authenticated.' }), {
			status: 401,
			headers: { 'content-type': 'application/json' },
		});
	}

	return next();
}
