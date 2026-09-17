-- Admin session storage and login throttling.
-- Apply with: npx wrangler d1 execute gentech-db --remote --file=./migrations/0002_add_admin_auth.sql

CREATE TABLE IF NOT EXISTS admin_sessions (
	token_hash TEXT PRIMARY KEY,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS login_attempts (
	ip TEXT PRIMARY KEY,
	failures INTEGER NOT NULL DEFAULT 0,
	window_start TEXT NOT NULL DEFAULT (datetime('now'))
);
