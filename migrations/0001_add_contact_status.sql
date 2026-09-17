-- Adds lead tracking to contacts created before the admin panel existed.
-- Apply with: npx wrangler d1 execute gentech-db --remote --file=./migrations/0001_add_contact_status.sql

ALTER TABLE contacts ADD COLUMN status TEXT NOT NULL DEFAULT 'new';
