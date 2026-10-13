-- Verified dashboard result: 2026-10-12 00:00 to 2026-10-13 00:00 JST.
-- HTTPS GET / or /index.html (query allowed), response status 200.
-- Separate day from live counting (started 2026-10-13). Never increment on replay.
CREATE TABLE IF NOT EXISTS access_imports (
 id TEXT PRIMARY KEY, day TEXT NOT NULL UNIQUE, game_views INTEGER NOT NULL,
 source TEXT NOT NULL, filter TEXT NOT NULL, verified_at INTEGER NOT NULL
);
INSERT OR IGNORE INTO access_daily(day,game_views,closed_views) VALUES('2026-10-12',1932,0);
INSERT OR IGNORE INTO access_imports VALUES('cloudflare-2026-10-12','2026-10-12',1932,'Cloudflare Observability dashboard','HTTPS GET / or /index.html with optional query; HTTP200; JST 00:00-24:00',1791857517487);
UPDATE access_metadata SET started_at=MIN(started_at,1791730800000) WHERE id=1;
