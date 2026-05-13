/**
 * AguiLangEvo · Database seed
 * Kaynak: src/data/verbs-a1.json  (130 kelime, EN→ES)
 * Hedef : words + word_translations tabloları
 *
 * Çalıştır: node src/db/seed.js
 */

import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join }  from 'path'
import {
  getDb, closeDb,
  upsertLanguage, ensureLanguagePair, upsertWord,
} from './db.js'

const require    = createRequire(import.meta.url)
const __dirname  = dirname(fileURLToPath(import.meta.url))
const DATA_PATH  = join(__dirname, '..', 'data', 'verbs-a1.json')

// ── JSON yükle ve özetle ──────────────────────────────────
const raw   = require(DATA_PATH)
const words = raw.words

console.log('─'.repeat(52))
console.log('AguiLangEvo · Seed başlıyor')
console.log('─'.repeat(52))
console.log(`Kaynak dosya  : src/data/verbs-a1.json`)
console.log(`Kategori      : ${raw.category}  |  Seviye: ${raw.level.toUpperCase()}`)
console.log(`Toplam kelime : ${words.length}`)
console.log(`ES dolu       : ${words.filter(w => w.es?.trim()).length}`)
console.log(`PT dolu       : ${words.filter(w => w.pt?.trim()).length}  (bu seed'de atlanır)`)
console.log('─'.repeat(52))

// ── DB bağlan ─────────────────────────────────────────────
const db = getDb()

// ── 1. Diller ─────────────────────────────────────────────
console.log('\n[1/4] Diller seed ediliyor…')
upsertLanguage({ id: 'en', name: 'English',    native_name: 'English',   flag: '🇺🇸' })
upsertLanguage({ id: 'es', name: 'Spanish',    native_name: 'Español',   flag: '🇪🇸' })
upsertLanguage({ id: 'pt', name: 'Portuguese', native_name: 'Português', flag: '🇧🇷' })
console.log('  ✓ en, es, pt eklendi')

// ── 2. Dil çiftleri ───────────────────────────────────────
console.log('\n[2/4] Dil çiftleri oluşturuluyor…')
const pairEnEs = ensureLanguagePair('en', 'es')
const pairEnPt = ensureLanguagePair('en', 'pt')
const pairEsEn = ensureLanguagePair('es', 'en')
const pairPtEn = ensureLanguagePair('pt', 'en')
console.log(`  ✓ en→es (id:${pairEnEs})  en→pt (id:${pairEnPt})`)
console.log(`  ✓ es→en (id:${pairEsEn})  pt→en (id:${pairPtEn})`)

// ── 3. Kelimeler + çeviriler ──────────────────────────────
console.log('\n[3/4] Kelimeler ve çeviriler ekleniyor…')

let insertedWords  = 0
let insertedTrans  = 0
let skippedPt      = 0
const errors       = []

for (const w of words) {
  const cefrLevel = (w.level || raw.level || 'a1').toUpperCase()

  const wordData = {
    word:           w.en.trim(),
    language_id:    'en',
    part_of_speech: raw.category === 'verbs' ? 'verb' : raw.category,
    cefr_level:     cefrLevel,
    ipa:            w.pron || null,
  }

  try {
    // "ser / estar" → main: "ser", alts: ["estar"]
    const esParts = (w.es || '').split('/').map(s => s.trim()).filter(Boolean)
    const esMain  = esParts[0] || null
    const esAlts  = esParts.length > 1 ? JSON.stringify(esParts.slice(1)) : null

    const esData = esMain
      ? { target_lang: 'es', translation: esMain, alt_translations: esAlts,
          example_source: null, example_target: null }
      : null

    upsertWord(wordData, esData)
    insertedWords++
    if (esData) insertedTrans++

    // PT boşsa kayıt atla, sayacı tut
    if (!w.pt?.trim()) {
      skippedPt++
    } else {
      // İleride PT verisi gelirse burada eklenir
      const wordId = db.prepare(
        'SELECT id FROM words WHERE word = ? AND language_id = ?'
      ).get(w.en.trim(), 'en')?.id

      if (wordId) {
        db.prepare(`
          INSERT INTO word_translations
            (word_id, target_lang, translation)
          VALUES (?, 'pt', ?)
          ON CONFLICT(word_id, target_lang) DO UPDATE SET
            translation = excluded.translation
        `).run(wordId, w.pt.trim())
        insertedTrans++
      }
    }
  } catch (err) {
    errors.push({ word: w.en, error: err.message })
  }
}

// ── 4. Özet ───────────────────────────────────────────────
console.log('\n[4/4] Özet')
console.log('─'.repeat(52))

const wordCount  = db.prepare("SELECT COUNT(*) AS c FROM words").get().c
const transCount = db.prepare("SELECT COUNT(*) AS c FROM word_translations").get().c
const esCount    = db.prepare("SELECT COUNT(*) AS c FROM word_translations WHERE target_lang='es'").get().c
const ptCount    = db.prepare("SELECT COUNT(*) AS c FROM word_translations WHERE target_lang='pt'").get().c

console.log(`  words tablosu          : ${wordCount} satır`)
console.log(`  word_translations      : ${transCount} satır`)
console.log(`    → ES çevirileri      : ${esCount}`)
console.log(`    → PT çevirileri      : ${ptCount}  (veri boş, atlandı)`)
console.log(`  Bu seed'de eklenen     : ${insertedWords} kelime, ${insertedTrans} çeviri`)
console.log(`  Atlanan PT             : ${skippedPt} kelime`)

if (errors.length > 0) {
  console.log(`\n  ⚠️  Hatalı kelimeler (${errors.length}):`)
  errors.forEach(e => console.log(`    - ${e.word}: ${e.error}`))
} else {
  console.log('\n  Hata: YOK')
}

console.log('─'.repeat(52))
console.log('Seed tamamlandı ✅')
console.log('─'.repeat(52))

closeDb()
