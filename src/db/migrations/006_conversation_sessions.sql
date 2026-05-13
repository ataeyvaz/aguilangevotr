CREATE TABLE IF NOT EXISTS conversation_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  pack_id INTEGER NOT NULL,
  language_pair_id INTEGER NOT NULL,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  total_exchanges INTEGER DEFAULT 0,
  completed_exchanges INTEGER DEFAULT 0,
  pick_score INTEGER DEFAULT 0,
  type_score INTEGER DEFAULT 0,
  speak_score INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  avg_pronunciation REAL DEFAULT 0,
  is_completed INTEGER DEFAULT 0,
  FOREIGN KEY (profile_id) REFERENCES profiles(id),
  FOREIGN KEY (pack_id) REFERENCES conversation_packs(id),
  FOREIGN KEY (language_pair_id) REFERENCES language_pairs(id)
);

CREATE TABLE IF NOT EXISTS session_exchanges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  exchange_id INTEGER NOT NULL,
  mode TEXT CHECK(mode IN ('pick','type','speak')) NOT NULL,
  is_correct INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  pronunciation_score REAL,
  user_answer TEXT,
  response_time_ms INTEGER,
  attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES conversation_sessions(id),
  FOREIGN KEY (exchange_id) REFERENCES conversation_exchanges(id)
);

CREATE INDEX IF NOT EXISTS idx_conv_sessions_profile
  ON conversation_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_session_exchanges_session
  ON session_exchanges(session_id);