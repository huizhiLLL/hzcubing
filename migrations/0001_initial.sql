CREATE TABLE users (
  user_no INTEGER PRIMARY KEY AUTOINCREMENT CHECK (user_no > 0),
  id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nickname TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  wca_id TEXT NOT NULL DEFAULT '',
  avatar_key TEXT,
  qq_id TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE events (
  code TEXT PRIMARY KEY NOT NULL,
  id TEXT UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('official', 'fun', 'meme', 'historical')),
  description TEXT NOT NULL DEFAULT '',
  icon_id TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_by TEXT,
  created_by_name TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE records (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  nickname TEXT NOT NULL,
  event TEXT NOT NULL REFERENCES events(code),
  single_seconds REAL,
  average_seconds REAL,
  cube TEXT,
  method TEXT,
  competition TEXT,
  solves TEXT CHECK (solves IS NULL OR json_valid(solves)),
  timestamp INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX records_user_time ON records(user_id, timestamp DESC, id);
CREATE INDEX records_event_time ON records(event, timestamp, id);
CREATE INDEX records_event_single ON records(event, single_seconds) WHERE single_seconds IS NOT NULL;
CREATE INDEX records_event_average ON records(event, average_seconds) WHERE average_seconds IS NOT NULL;

CREATE TABLE sessions (
  digest TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_expiry ON sessions(expires_at);
