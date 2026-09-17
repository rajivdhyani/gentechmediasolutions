-- Stores the admin password hash set through the one-time browser setup page,
-- so the password never has to travel through a terminal or a chat.
-- Apply with: npx wrangler d1 execute gentech-db --remote --file=./migrations/0003_add_admin_credentials.sql

CREATE TABLE IF NOT EXISTS admin_credentials (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	password_hash TEXT NOT NULL,
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
