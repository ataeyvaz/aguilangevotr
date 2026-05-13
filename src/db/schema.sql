-- ============================================================
-- AguiLangEvo · Database Schema
-- Target: EN learning for ES/PT speakers
-- SRS: SM-2 algorithm
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ── Core reference tables ─────────────────────────────────

CREATE TABLE IF NOT EXISTS languages (
  id          TEXT PRIMARY KEY,           -- 'en' | 'es' | 'pt'
  name        TEXT NOT NULL,              -- 'English'
  native_name TEXT NOT NULL,              -- 'Español'
  flag        TEXT,                       -- emoji '🇺🇸' or path
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS language_pairs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  source_lang TEXT    NOT NULL REFERENCES languages(id),
  target_lang TEXT    NOT NULL REFERENCES languages(id),
  is_active   INTEGER NOT NULL DEFAULT 1,
  UNIQUE(source_lang, target_lang)
);

-- ── User profile ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT    NOT NULL DEFAULT 'Aguila',
  type             TEXT    NOT NULL DEFAULT 'adult'
                   CHECK(type IN ('adult','child')),
  avatar_initial   TEXT,
  points           INTEGER NOT NULL DEFAULT 0,
  level            INTEGER NOT NULL DEFAULT 1,
  streak           INTEGER NOT NULL DEFAULT 0,
  last_active_date TEXT,
  created_at       TEXT DEFAULT (datetime('now'))
);

-- ── Vocabulary ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS words (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  word           TEXT    NOT NULL,
  language_id    TEXT    NOT NULL REFERENCES languages(id),
  part_of_speech TEXT,                   -- noun | verb | adj | adv | phrase
  cefr_level     TEXT    CHECK(cefr_level IN ('A1','A2','B1','B2','C1','C2')),
  frequency_rank INTEGER,
  ipa            TEXT,                   -- /ˈwɔːtər/
  audio_path     TEXT,
  image_path     TEXT,
  created_at     TEXT DEFAULT (datetime('now')),
  UNIQUE(word, language_id)
);

CREATE TABLE IF NOT EXISTS word_translations (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id         INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  target_lang     TEXT    NOT NULL REFERENCES languages(id),
  translation     TEXT    NOT NULL,
  alt_translations TEXT,                 -- JSON: ["agua","líquido"]
  example_source  TEXT,                  -- "I drink water every day."
  example_target  TEXT,                  -- "Bebo agua todos los días."
  notes           TEXT,
  created_at      TEXT DEFAULT (datetime('now')),
  UNIQUE(word_id, target_lang)
);

CREATE TABLE IF NOT EXISTS audio_files (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id     INTEGER REFERENCES words(id) ON DELETE CASCADE,
  language_id TEXT    NOT NULL REFERENCES languages(id),
  file_path   TEXT    NOT NULL,
  voice_id    TEXT,                      -- TTS voice identifier
  duration_ms INTEGER,
  created_at  TEXT DEFAULT (datetime('now'))
);

-- ── Curriculum ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lessons (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  title            TEXT    NOT NULL,
  description      TEXT,
  language_pair_id INTEGER REFERENCES language_pairs(id),
  cefr_level       TEXT    CHECK(cefr_level IN ('A1','A2','B1','B2','C1','C2')),
  order_index      INTEGER NOT NULL DEFAULT 0,
  is_active        INTEGER NOT NULL DEFAULT 1,
  created_at       TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lesson_words (
  lesson_id   INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  word_id     INTEGER NOT NULL REFERENCES words(id)   ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (lesson_id, word_id)
);

CREATE TABLE IF NOT EXISTS exercises (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id   INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
  word_id     INTEGER REFERENCES words(id)   ON DELETE CASCADE,
  type        TEXT NOT NULL,             -- flashcard|quiz|spelling|listening|speaking
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  distractors TEXT,                      -- JSON: ["wrong1","wrong2","wrong3"]
  difficulty  INTEGER DEFAULT 1 CHECK(difficulty BETWEEN 1 AND 5),
  created_at  TEXT DEFAULT (datetime('now'))
);

-- ── Placement test ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS placement_questions (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  question         TEXT NOT NULL,
  answer           TEXT NOT NULL,
  distractors      TEXT NOT NULL,        -- JSON: 3 wrong answers
  cefr_level       TEXT NOT NULL CHECK(cefr_level IN ('A1','A2','B1','B2')),
  language_pair_id INTEGER REFERENCES language_pairs(id),
  order_index      INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS placement_results (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id       INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  language_pair_id INTEGER NOT NULL REFERENCES language_pairs(id),
  taken_at         TEXT    NOT NULL DEFAULT (datetime('now')),
  score            INTEGER NOT NULL,     -- 0–100
  cefr_result      TEXT    NOT NULL CHECK(cefr_result IN ('A1','A2','B1','B2')),
  answers          TEXT    NOT NULL,     -- JSON: [{question_id,chosen,correct}]
  time_seconds     INTEGER
);

-- ── SRS · SM-2 user progress ──────────────────────────────

CREATE TABLE IF NOT EXISTS user_progress (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id       INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word_id          INTEGER NOT NULL REFERENCES words(id)    ON DELETE CASCADE,
  language_pair_id INTEGER NOT NULL REFERENCES language_pairs(id),

  -- SM-2 core fields
  repetitions      INTEGER NOT NULL DEFAULT 0,
  ease_factor      REAL    NOT NULL DEFAULT 2.5,
  interval_days    INTEGER NOT NULL DEFAULT 0,
  next_review_date TEXT,                 -- ISO date: '2026-05-03'

  -- Running stats
  correct_count    INTEGER NOT NULL DEFAULT 0,
  wrong_count      INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TEXT,

  status           TEXT NOT NULL DEFAULT 'new'
                   CHECK(status IN ('new','learning','review','mastered')),

  created_at       TEXT DEFAULT (datetime('now')),
  UNIQUE(profile_id, word_id, language_pair_id)
);

-- ── Session logging ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS session_logs (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id       INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  language_pair_id INTEGER REFERENCES language_pairs(id),
  started_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  ended_at         TEXT,
  duration_seconds INTEGER,
  words_reviewed   INTEGER DEFAULT 0,
  correct_answers  INTEGER DEFAULT 0,
  xp_earned        INTEGER DEFAULT 0,
  session_type     TEXT    DEFAULT 'mixed'
                   CHECK(session_type IN ('flashcard','quiz','placement','mixed'))
);

-- ── Indexes ───────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_words_language
  ON words(language_id);
CREATE INDEX IF NOT EXISTS idx_words_cefr
  ON words(cefr_level);
CREATE INDEX IF NOT EXISTS idx_translations_word
  ON word_translations(word_id);
CREATE INDEX IF NOT EXISTS idx_progress_profile
  ON user_progress(profile_id);
CREATE INDEX IF NOT EXISTS idx_progress_next_review
  ON user_progress(next_review_date);
CREATE INDEX IF NOT EXISTS idx_progress_status
  ON user_progress(profile_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_profile
  ON session_logs(profile_id);
