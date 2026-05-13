/**
 * AguiLangEvo · Database connection (Node.js only)
 *
 * Kullanım: seed.js, migration scriptleri, build-time araçlar.
 * Browser/Capacitor WebView içinde import ETMEYİN.
 *
 * better-sqlite3 CommonJS modülü olduğundan ESM projede
 * createRequire ile yükleniyor.
 */

import { createRequire }   from 'module'
import { fileURLToPath }   from 'url'
import { dirname, join }   from 'path'
import { readFileSync, existsSync, mkdirSync } from 'fs'

const require     = createRequire(import.meta.url)
const Database    = require('better-sqlite3')

const __dirname   = dirname(fileURLToPath(import.meta.url))
const DATA_DIR    = join(__dirname, '..', '..', 'data')
const DB_PATH     = join(DATA_DIR, 'aguilangevo.db')
const SCHEMA_PATH = join(__dirname, 'schema.sql')

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

// ── Singleton bağlantı ────────────────────────────────────
let _db = null

export function getDb() {
  if (_db) return _db

  _db = new Database(DB_PATH)

  // Temel PRAGMA'lar — bağlantı açılır açılmaz set edilmeli
  _db.pragma('journal_mode = WAL')   // eşzamanlı okuma için
  _db.pragma('foreign_keys = ON')    // FK kısıtlamalarını zorla
  _db.pragma('synchronous = NORMAL') // WAL ile güvenli, hızlı
  _db.pragma('cache_size = -16000')  // 16 MB sayfa önbelleği
  _db.pragma('temp_store = MEMORY')  // geçici tablolar RAM'de

  runMigrations(_db)

  return _db
}

export function closeDb() {
  if (_db) {
    _db.close()
    _db = null
  }
}

// ── Migration runner ──────────────────────────────────────

const MIGRATIONS = [
  {
    name: '001_initial_schema',
    up: () => readFileSync(SCHEMA_PATH, 'utf8'),
  },
  {
    name: '002_add_placement_columns',
    up: () => readFileSync(join(__dirname, 'migrations', '002_add_placement_columns.sql'), 'utf8'),
  },
  {
    name: '003_add_ui_language',
    up: () => readFileSync(join(__dirname, 'migrations', '003_add_ui_language.sql'), 'utf8'),
  },
  {
    name: '004_add_translation_meta',
    up: () => readFileSync(join(__dirname, 'migrations', '004_add_translation_meta.sql'), 'utf8'),
  },
  {
    name: '005_conversation_packs',
    up: () => readFileSync(join(__dirname, 'migrations', '005_conversation_packs.sql'), 'utf8'),
  },
  {
    name: '006_conversation_sessions',
    up: () => readFileSync(join(__dirname, 'migrations', '006_conversation_sessions.sql'), 'utf8'),
  },
]

function runMigrations(db) {
  // Migration tablosu her zaman önce oluşturulur
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL UNIQUE,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `)

  const applied = new Set(
    db.prepare('SELECT name FROM _migrations').all().map(r => r.name)
  )

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.name)) continue

    const sql = migration.up()

    db.transaction(() => {
      db.exec(sql)
      db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(migration.name)
    })()

    console.log(`✅ Migration uygulandı: ${migration.name}`)
  }
}

// ── Yardımcı sorgular (seed scriptleri için) ──────────────

/**
 * Dil ekler veya varsa günceller.
 * @param {{ id: string, name: string, native_name: string, flag?: string }} lang
 */
export function upsertLanguage(lang) {
  const db = getDb()
  db.prepare(`
    INSERT INTO languages (id, name, native_name, flag)
    VALUES (@id, @name, @native_name, @flag)
    ON CONFLICT(id) DO UPDATE SET
      name        = excluded.name,
      native_name = excluded.native_name,
      flag        = excluded.flag
  `).run(lang)
}

/**
 * Kelime + çeviriyi atomik olarak ekler.
 * @param {{ word, language_id, part_of_speech, cefr_level, ipa }} wordData
 * @param {{ target_lang, translation, alt_translations, example_source, example_target }} transData
 * @returns {number} word.id
 */
export function upsertWord(wordData, transData) {
  const db = getDb()

  return db.transaction(() => {
    const existing = db.prepare(
      'SELECT id FROM words WHERE word = ? AND language_id = ?'
    ).get(wordData.word, wordData.language_id)

    const wordId = existing
      ? existing.id
      : db.prepare(`
          INSERT INTO words
            (word, language_id, part_of_speech, cefr_level, ipa)
          VALUES
            (@word, @language_id, @part_of_speech, @cefr_level, @ipa)
        `).run(wordData).lastInsertRowid

    if (transData) {
      db.prepare(`
        INSERT INTO word_translations
          (word_id, target_lang, translation, alt_translations,
           example_source, example_target)
        VALUES
          (@word_id, @target_lang, @translation, @alt_translations,
           @example_source, @example_target)
        ON CONFLICT(word_id, target_lang) DO UPDATE SET
          translation     = excluded.translation,
          alt_translations = excluded.alt_translations,
          example_source  = excluded.example_source,
          example_target  = excluded.example_target
      `).run({ word_id: wordId, ...transData })
    }

    return wordId
  })()
}

/**
 * Dil çiftini ekler veya varsa döner.
 * @param {string} source  'en'
 * @param {string} target  'es' | 'pt'
 * @returns {number} language_pair.id
 */
export function ensureLanguagePair(source, target) {
  const db = getDb()
  db.prepare(`
    INSERT OR IGNORE INTO language_pairs (source_lang, target_lang)
    VALUES (?, ?)
  `).run(source, target)
  return db.prepare(
    'SELECT id FROM language_pairs WHERE source_lang = ? AND target_lang = ?'
  ).get(source, target).id
}
