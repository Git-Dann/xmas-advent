-- The 25th Key: initial schema.
-- Puzzle definitions and answers ship as server code (version-controlled, type-checked, tested).
-- D1 holds players, progress, rewards, media metadata and Dan's private content overrides.
-- All timestamps are ISO 8601 UTC strings.

CREATE TABLE players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('real', 'preview')),
  created_at TEXT NOT NULL
);

-- Invitation and recovery codes. Only a SHA-256 hash of each code is stored.
CREATE TABLE access_codes (
  code_hash TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id),
  label TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revoked_at TEXT
);

-- Player and admin sessions. Only a SHA-256 hash of the session token is stored.
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('player', 'admin')),
  player_id TEXT REFERENCES players(id),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  CHECK ((role = 'player' AND player_id IS NOT NULL) OR (role = 'admin' AND player_id IS NULL))
);
CREATE INDEX idx_sessions_player ON sessions(player_id);

CREATE TABLE puzzle_progress (
  player_id TEXT NOT NULL REFERENCES players(id),
  day INTEGER NOT NULL CHECK (day BETWEEN 1 AND 25),
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'complete')),
  started_at TEXT NOT NULL,
  completed_at TEXT,
  PRIMARY KEY (player_id, day)
);

CREATE TABLE puzzle_stage_progress (
  player_id TEXT NOT NULL REFERENCES players(id),
  day INTEGER NOT NULL CHECK (day BETWEEN 1 AND 25),
  stage TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  PRIMARY KEY (player_id, day, stage)
);

CREATE TABLE player_evidence (
  player_id TEXT NOT NULL REFERENCES players(id),
  evidence_id TEXT NOT NULL,
  source_day INTEGER NOT NULL,
  acquired_at TEXT NOT NULL,
  PRIMARY KEY (player_id, evidence_id)
);

-- Server-awarded entitlements: archive access, the lamp, the Christmas Key.
CREATE TABLE player_rewards (
  player_id TEXT NOT NULL REFERENCES players(id),
  reward_id TEXT NOT NULL,
  source_day INTEGER NOT NULL,
  awarded_at TEXT NOT NULL,
  PRIMARY KEY (player_id, reward_id)
);

CREATE TABLE hint_usage (
  player_id TEXT NOT NULL REFERENCES players(id),
  day INTEGER NOT NULL,
  hint_index INTEGER NOT NULL CHECK (hint_index BETWEEN 1 AND 3),
  revealed_at TEXT NOT NULL,
  PRIMARY KEY (player_id, day, hint_index)
);

-- Attempt log for debugging and rate limiting. Never used for scoring.
CREATE TABLE attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL REFERENCES players(id),
  day INTEGER NOT NULL,
  stage TEXT NOT NULL,
  correct INTEGER NOT NULL,
  submitted TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_attempts_player_time ON attempts(player_id, created_at);

CREATE TABLE player_preferences (
  player_id TEXT PRIMARY KEY REFERENCES players(id),
  prefs TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Dan's private edits to narrative, hints, answers and the final message.
CREATE TABLE content_overrides (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE media_assets (
  id TEXT PRIMARY KEY,
  slot TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_media_slot ON media_assets(slot);

CREATE TABLE admin_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT NOT NULL
);

-- Fixed-window rate limiting.
CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL
);

-- Server settings, such as the preview player's simulated date. Never applies to the real player.
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
