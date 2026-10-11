CREATE TABLE IF NOT EXISTS admin_credentials (
 id INTEGER PRIMARY KEY CHECK (id=1), password_hash TEXT NOT NULL, salt TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS admin_sessions (token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS admin_sessions_expiry ON admin_sessions(expires_at);
CREATE TABLE IF NOT EXISTS admin_attempts (
 attempt_key TEXT NOT NULL, bucket INTEGER NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(attempt_key,bucket)
);
