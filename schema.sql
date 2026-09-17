-- D1 schema for contact submissions and follow-up questionnaire responses.
-- Apply with: npx wrangler d1 execute gentech-db --file=./schema.sql

CREATE TABLE IF NOT EXISTS contacts (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	email TEXT NOT NULL,
	topic TEXT NOT NULL,
	message TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'new',
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS questionnaire_responses (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	contact_id INTEGER REFERENCES contacts(id),
	section TEXT NOT NULL,
	answers_json TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_questionnaire_contact_id ON questionnaire_responses(contact_id);

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
