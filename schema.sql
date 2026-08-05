-- KRGC Phase 2 — Cloudflare D1 (SQLite)
-- Apply with: wrangler d1 execute krgc --file=schema.sql

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS members (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL COLLATE NOCASE,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  role          TEXT NOT NULL DEFAULT 'member'
                  CHECK (role IN ('member','officer','ro')),
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','inactive','pending')),
  joined_on     TEXT,
  hidden        INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS sessions (
  token         TEXT PRIMARY KEY,
  member_id     TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  expires_at    TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  via           TEXT NOT NULL DEFAULT 'magic'
                  CHECK (via IN ('magic','passcode'))
);

CREATE TABLE IF NOT EXISTS magic_links (
  token         TEXT PRIMARY KEY,
  email         TEXT NOT NULL COLLATE NOCASE,
  expires_at    TEXT NOT NULL,
  used_at       TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS checkins (
  id              TEXT PRIMARY KEY,
  member_id       TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  checked_in_at   TEXT NOT NULL,
  checked_out_at  TEXT,
  location        TEXT NOT NULL DEFAULT 'gate'
);

CREATE INDEX IF NOT EXISTS idx_checkins_open
  ON checkins(member_id, checked_out_at);
CREATE INDEX IF NOT EXISTS idx_checkins_purge
  ON checkins(checked_in_at);

CREATE TABLE IF NOT EXISTS matches (
  id            TEXT PRIMARY KEY,
  date          TEXT NOT NULL,
  discipline    TEXT NOT NULL DEFAULT 'rimfire',
  name          TEXT NOT NULL,
  capacity      INTEGER NOT NULL DEFAULT 24,
  status        TEXT NOT NULL DEFAULT 'open'
                  CHECK (status IN ('draft','open','live','closed')),
  weather       TEXT,
  season        TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS squads (
  match_id      TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  member_id     TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  position      INTEGER,
  waitlisted    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (match_id, member_id)
);

CREATE TABLE IF NOT EXISTS scores (
  id            TEXT PRIMARY KEY,
  match_id      TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  member_id     TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  stage         INTEGER NOT NULL DEFAULT 1,
  value         REAL NOT NULL,
  sights        TEXT,
  entered_by    TEXT REFERENCES members(id),
  entered_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  client_id     TEXT,
  UNIQUE (match_id, member_id, stage)
);

CREATE TABLE IF NOT EXISTS hours (
  id            TEXT PRIMARY KEY,
  member_id     TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  event_date    TEXT NOT NULL,
  hours         REAL NOT NULL,
  note          TEXT,
  logged_by     TEXT REFERENCES members(id),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS alerts (
  id                TEXT PRIMARY KEY,
  channel           TEXT NOT NULL CHECK (channel IN ('email','sms')),
  address           TEXT NOT NULL,
  verified          INTEGER NOT NULL DEFAULT 0,
  verify_token      TEXT,
  unsubscribed_at   TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (channel, address)
);

CREATE TABLE IF NOT EXISTS range_status (
  id            INTEGER PRIMARY KEY CHECK (id = 1),
  open          INTEGER NOT NULL DEFAULT 1,
  detail        TEXT NOT NULL DEFAULT '',
  notice        TEXT NOT NULL DEFAULT '',
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_by    TEXT
);

INSERT OR IGNORE INTO range_status (id, open, detail, notice)
VALUES (1, 1, '', '');

-- Seed demo officers / members (replace emails before production)
INSERT OR IGNORE INTO members (id, email, name, slug, role, status, joined_on)
VALUES
  ('m_officer', 'officers@example.org', 'Club Officer', 'club-officer', 'officer', 'active', '2020-01-01'),
  ('m_ro',      'ro@example.org',       'Range Officer', 'range-officer', 'ro', 'active', '2021-01-01'),
  ('m_member',  'member@example.org',   'Example, A.', 'example-a', 'member', 'active', '2022-01-01');
