-- Example migration: create a table
-- Applied by: npm run db:upgrade
-- Reversed by: migrations/0001_example.down.sql

CREATE TABLE IF NOT EXISTS example (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT    NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
