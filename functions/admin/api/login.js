import {
	SESSION_COOKIE,
	SESSION_HOURS,
	hashToken,
	readCookie,
	sessionCookie,
	verifyPassword,
} from '../auth.js';

const MAX_FAILURES = 8;
const WINDOW_MINUTES = 15;

function json(data, status = 200, headers = {}) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers },
	});
}

async function isThrottled(db, ip) {
	const row = await db
		.prepare(
			`SELECT failures FROM login_attempts
			 WHERE ip = ? AND window_start > datetime('now', '-${WINDOW_MINUTES} minutes')`
		)
		.bind(ip)
		.first();
	return (row?.failures ?? 0) >= MAX_FAILURES;
}

async function recordFailure(db, ip) {
	await db
		.prepare(
			`INSERT INTO login_attempts (ip, failures, window_start)
			 VALUES (?, 1, datetime('now'))
			 ON CONFLICT(ip) DO UPDATE SET
			   failures = CASE
			     WHEN window_start > datetime('now', '-${WINDOW_MINUTES} minutes')
			     THEN failures + 1 ELSE 1 END,
			   window_start = CASE
			     WHEN window_start > datetime('now', '-${WINDOW_MINUTES} minutes')
			     THEN window_start ELSE datetime('now') END`
		)
		.bind(ip)
		.run();
}

export async function onRequestPost({ request, env }) {
	if (!env.ADMIN_PASSWORD_HASH) {
		return json({ error: 'Admin password is not configured.' }, 503);
	}

	const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';

	if (await isThrottled(env.DB, ip)) {
		return json({ error: 'Too many attempts. Try again in 15 minutes.' }, 429);
	}

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body.' }, 400);
	}

	const password = String(body.password ?? '');
	const ok = password.length > 0 && (await verifyPassword(password, env.ADMIN_PASSWORD_HASH));

	if (!ok) {
		await recordFailure(env.DB, ip);
		return json({ error: 'Incorrect password.' }, 401);
	}

	const token = [...crypto.getRandomValues(new Uint8Array(32))]
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');

	await env.DB.prepare(
		`INSERT INTO admin_sessions (token_hash, expires_at)
		 VALUES (?, datetime('now', '+${SESSION_HOURS} hours'))`
	)
		.bind(await hashToken(token))
		.run();

	await env.DB.prepare("DELETE FROM admin_sessions WHERE expires_at <= datetime('now')").run();
	await env.DB.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(ip).run();

	return json({ ok: true }, 200, { 'set-cookie': sessionCookie(token, SESSION_HOURS * 3600) });
}

export async function onRequestDelete({ request, env }) {
	const token = readCookie(request, SESSION_COOKIE);
	if (token) {
		await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash = ?')
			.bind(await hashToken(token))
			.run();
	}
	return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', 0) });
}
