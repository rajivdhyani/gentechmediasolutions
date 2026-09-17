// Generates the ADMIN_PASSWORD_HASH value for the admin panel.
// Run: node scripts/hash-password.mjs
// Your password is typed locally with no echo and never leaves this machine —
// only the resulting hash is printed, and that is what you store as the secret.

import { webcrypto } from 'node:crypto';
import { stdin, stdout } from 'node:process';

// Must match PBKDF2_ITERATIONS in functions/admin/auth.js.
const ITERATIONS = 25000;

function prompt(question) {
	return new Promise((resolve) => {
		stdout.write(question);
		const wasRaw = stdin.isRaw;
		stdin.setRawMode?.(true);
		stdin.resume();
		let value = '';
		const onData = (chunk) => {
			const char = chunk.toString('utf8');
			if (char === '\r' || char === '\n') {
				stdin.setRawMode?.(wasRaw ?? false);
				stdin.pause();
				stdin.off('data', onData);
				stdout.write('\n');
				resolve(value);
			} else if (char === '') {
				stdout.write('\n');
				process.exit(1);
			} else if (char === '' || char === '\b') {
				value = value.slice(0, -1);
			} else {
				value += char;
			}
		};
		stdin.on('data', onData);
	});
}

const password = await prompt('New admin password: ');
if (password.length < 12) {
	console.error('\nPassword must be at least 12 characters. Nothing was generated.');
	process.exit(1);
}

const confirmation = await prompt('Confirm password: ');
if (password !== confirmation) {
	console.error('\nPasswords did not match. Nothing was generated.');
	process.exit(1);
}

const salt = webcrypto.getRandomValues(new Uint8Array(16));
const key = await webcrypto.subtle.importKey(
	'raw',
	new TextEncoder().encode(password),
	'PBKDF2',
	false,
	['deriveBits']
);
const bits = await webcrypto.subtle.deriveBits(
	{ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
	key,
	256
);

const b64 = (bytes) => Buffer.from(bytes).toString('base64');
const hash = `pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(new Uint8Array(bits))}`;

console.log('\nYour ADMIN_PASSWORD_HASH:\n');
console.log(hash);
console.log('\nStore it with:\n');
console.log('  npx wrangler pages secret put ADMIN_PASSWORD_HASH --project-name=gentechmediasolutions\n');
console.log('Paste the hash above when prompted. Keep your password itself somewhere safe.');
