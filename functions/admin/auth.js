export const SESSION_COOKIE = 'admin_session';
export const SESSION_HOURS = 12;

// The Workers free plan allows 10ms CPU per request and 50k iterations measured ~8ms,
// which left no headroom for the rest of the login. Online guessing is bounded by the
// login_attempts throttle instead. verifyPassword reads the count from the stored hash,
// so raising this later does not invalidate existing passwords.
const PBKDF2_ITERATIONS = 25000;

const encoder = new TextEncoder();

function toBase64(bytes) {
	return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value) {
	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

export function constantTimeEqual(a, b) {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
	return diff === 0;
}

async function deriveBits(password, salt, iterations) {
	const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
		'deriveBits',
	]);
	const bits = await crypto.subtle.deriveBits(
		{ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
		key,
		256
	);
	return new Uint8Array(bits);
}

export async function hashPassword(password) {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const derived = await deriveBits(password, salt, PBKDF2_ITERATIONS);
	return `pbkdf2$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(derived)}`;
}

export async function verifyPassword(password, stored) {
	const parts = String(stored).split('$');
	if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;

	const iterations = Number(parts[1]);
	if (!Number.isInteger(iterations) || iterations < 1000 || iterations > 500000) return false;

	let salt;
	let expected;
	try {
		salt = fromBase64(parts[2]);
		expected = fromBase64(parts[3]);
	} catch {
		return false;
	}

	const derived = await deriveBits(password, salt, iterations);
	return constantTimeEqual(derived, expected);
}

// The password set through the browser setup page lives in D1; ADMIN_PASSWORD_HASH
// remains supported so the secret can still be used instead.
export async function storedPasswordHash(env) {
	const row = await env.DB.prepare('SELECT password_hash FROM admin_credentials WHERE id = 1').first();
	return row?.password_hash ?? env.ADMIN_PASSWORD_HASH ?? null;
}

export async function hashToken(token) {
	const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token));
	return toBase64(new Uint8Array(digest));
}

export function readCookie(request, name) {
	const header = request.headers.get('cookie');
	if (!header) return null;
	for (const part of header.split(';')) {
		const [key, ...rest] = part.trim().split('=');
		if (key === name) return rest.join('=') || null;
	}
	return null;
}

export function sessionCookie(token, maxAgeSeconds) {
	return `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}`;
}
