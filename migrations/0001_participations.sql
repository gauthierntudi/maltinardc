CREATE TABLE IF NOT EXISTS participations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  telephone TEXT NOT NULL,
  majeur INTEGER NOT NULL CHECK (majeur = 1),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_participations_telephone ON participations (telephone);

CREATE INDEX IF NOT EXISTS idx_participations_created_at ON participations (created_at DESC);
