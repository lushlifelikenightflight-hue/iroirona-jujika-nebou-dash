CREATE TABLE IF NOT EXISTS publication (
 id INTEGER PRIMARY KEY CHECK (id=1),
 enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
 starts_at INTEGER,
 ends_at INTEGER,
 before_message TEXT NOT NULL,
 after_message TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 0,
 updated_at INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO publication (id,before_message,after_message)
VALUES (1,'公開開始まで、もう少しお待ちください。','公開期間は終了しました。遊んでくれてありがとう。');
