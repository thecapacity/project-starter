-- Link Surfer: links table
-- Applied by: npm run db:upgrade
-- Reversed by: migrations/0001_links.down.sql

CREATE TABLE IF NOT EXISTS links (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  url         TEXT    NOT NULL,
  title       TEXT,
  description TEXT,
  image_url   TEXT,
  status      TEXT    NOT NULL DEFAULT 'unread',  -- 'unread' | 'saved' | 'deleted'
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Seed data — add your own via:
--   wrangler d1 execute link-surfer --local \
--     --command="INSERT INTO links (url, title) VALUES ('https://example.com', 'Example')"
INSERT INTO links (url, title, description) VALUES
  ('https://en.wikipedia.org/wiki/Cloudflare', 'Cloudflare — Wikipedia', 'Overview of Cloudflare and its services'),
  ('https://developers.cloudflare.com/workers/', 'Cloudflare Workers Docs', 'Official documentation for CF Workers'),
  ('https://web.dev/learn/', 'Learn Web Dev — web.dev', 'Google''s structured web dev learning path'),
  ('https://jvns.ca', 'Julia Evans — jvns.ca', 'Approachable zines and posts on Linux, networking, and systems'),
  ('https://paulgraham.com/articles.html', 'Paul Graham Essays', 'Essays on startups, technology, and ideas');
