import { constantTimeEqual, hashPassword, storedPasswordHash } from '../auth.js';

const MIN_PASSWORD_LENGTH = 12;
const encoder = new TextEncoder();

function json(data, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
	});
}

function tokensMatch(provided, expected) {
	const a = encoder.encode(provided);
	const b = encoder.encode(expected);
	return a.length === b.length && constantTimeEqual(a, b);
}

// Reports whether setup is still available, so the page can explain itself
// without revealing anything useful to someone who should not be here.
export async function onRequestGet({ env }) {
	const configured = Boolean(await storedPasswordHash(env));
	return json({ available: !configured && Boolean(env.ADMIN_SETUP_TOKEN) });
}

export async function onRequestPost({ request, env }) {
	if (!env.ADMIN_SETUP_TOKEN) {
		return json({ error: 'Setup is closed.' }, 403);
	}

	// Once a password exists this endpoint is permanently inert, so a leaked
	// setup link cannot be used to take over the account later.
	if (await storedPasswordHash(env)) {
		return json({ error: 'A password is already set. Setup is closed.' }, 403);
	}

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body.' }, 400);
	}

	if (!tokensMatch(String(body.token ?? ''), env.ADMIN_SETUP_TOKEN)) {
		return json({ error: 'Invalid setup link.' }, 403);
	}

	const password = String(body.password ?? '');
	if (password.length < MIN_PASSWORD_LENGTH) {
		return json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }, 400);
	}

	await env.DB.prepare(
		`INSERT INTO admin_credentials (id, password_hash, updated_at)
		 VALUES (1, ?, datetime('now'))`
	)
		.bind(await hashPassword(password))
		.run();

	return json({ ok: true });
}
