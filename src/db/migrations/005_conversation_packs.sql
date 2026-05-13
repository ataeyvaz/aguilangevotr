-- ============================================================
-- Migration 005: Conversation Packs
-- ============================================================

CREATE TABLE IF NOT EXISTS conversation_packs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id       INTEGER REFERENCES words(id),
  word          TEXT    NOT NULL,
  level         TEXT    NOT NULL CHECK(level IN ('a1','a2','b1')),
  difficulty    TEXT    NOT NULL CHECK(difficulty IN ('easy','medium','hard')),
  context       TEXT,
  bot_language  TEXT    NOT NULL DEFAULT 'es',
  created_at    TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conversation_exchanges (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  pack_id         INTEGER NOT NULL
    REFERENCES conversation_packs(id) ON DELETE CASCADE,
  exchange_order  INTEGER NOT NULL,
  bot_message     TEXT    NOT NULL,
  options         TEXT    NOT NULL,       -- JSON array
  correct_index   INTEGER NOT NULL CHECK(correct_index BETWEEN 0 AND 3),
  points          INTEGER NOT NULL DEFAULT 10,
  feedback_correct TEXT,
  feedback_wrong   TEXT
);

CREATE TABLE IF NOT EXISTS user_conversation_progress (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id     INTEGER NOT NULL REFERENCES profiles(id),
  pack_id        INTEGER NOT NULL REFERENCES conversation_packs(id),
  completed      INTEGER NOT NULL DEFAULT 0,
  score          INTEGER NOT NULL DEFAULT 0,
  attempts       INTEGER NOT NULL DEFAULT 0,
  last_played_at TEXT,
  UNIQUE(profile_id, pack_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_word
  ON conversation_packs(word, difficulty);
CREATE INDEX IF NOT EXISTS idx_conv_exchanges
  ON conversation_exchanges(pack_id, exchange_order);
