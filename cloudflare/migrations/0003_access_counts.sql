CREATE TABLE access_daily (day TEXT PRIMARY KEY, game_views INTEGER NOT NULL DEFAULT 0, closed_views INTEGER NOT NULL DEFAULT 0);
CREATE TABLE access_metadata (id INTEGER PRIMARY KEY CHECK(id=1), started_at INTEGER NOT NULL);
INSERT INTO access_metadata VALUES(1, CAST(strftime('%s','now') AS INTEGER)*1000);
