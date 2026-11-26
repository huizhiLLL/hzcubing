CREATE TABLE events_new (
  code TEXT PRIMARY KEY NOT NULL,
  id TEXT UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('official', 'fun', 'meme', 'score', 'historical')),
  description TEXT NOT NULL DEFAULT '',
  icon_id TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_by TEXT,
  created_by_name TEXT,
  created_at INTEGER,
  updated_at INTEGER
);


CREATE TABLE records_new (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  nickname TEXT NOT NULL,
  event TEXT NOT NULL REFERENCES events_new(code),
  single_seconds REAL,
  average_seconds REAL,
  score REAL,
  cube TEXT,
  method TEXT,
  competition TEXT,
  solves TEXT CHECK (solves IS NULL OR json_valid(solves)),
  timestamp INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

INSERT INTO events_new (rowid, code, id, name, category, description, icon_id, active, created_by, created_by_name, created_at, updated_at)
  SELECT rowid, code, id, name, category, description, icon_id, active, created_by, created_by_name, created_at, updated_at FROM events;
INSERT INTO records_new (id, user_id, nickname, event, single_seconds, average_seconds, cube, method, competition, solves, timestamp, created_at, updated_at)
  SELECT id, user_id, nickname, event, single_seconds, average_seconds, cube, method, competition, solves, timestamp, created_at, updated_at FROM records;
DROP TABLE records;
DROP TABLE events;
ALTER TABLE events_new RENAME TO events;
ALTER TABLE records_new RENAME TO records;
CREATE INDEX records_user_time ON records(user_id, timestamp DESC, id);
CREATE INDEX records_event_time ON records(event, timestamp, id);
CREATE INDEX records_event_single ON records(event, single_seconds) WHERE single_seconds IS NOT NULL;
CREATE INDEX records_event_average ON records(event, average_seconds) WHERE average_seconds IS NOT NULL;

CREATE INDEX records_event_score ON records(event, score DESC) WHERE score IS NOT NULL;
