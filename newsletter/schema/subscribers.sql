-- Carolina PFAS Weekly — subscribers table for the SUBSCRIBERS_D1 binding
-- used by functions/api/subscribe.ts. Apply once after creating the D1
-- database and before binding it to the Cloudflare Pages project:
--   POST /accounts/{account_id}/d1/database/{database_id}/query
-- Binding name expected by the endpoint: SUBSCRIBERS_D1
CREATE TABLE IF NOT EXISTS subscribers (
  email TEXT PRIMARY KEY,
  name TEXT,
  county TEXT,
  role TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'pending_confirmation',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  confirm_token TEXT,
  unsubscribe_token TEXT
);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers (status);
