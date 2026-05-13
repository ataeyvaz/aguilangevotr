/**
 * AguiLangEvo · PT + ES örnek cümle seed scripti
 *
 * Kaynak : translations.json  (proje kök dizini, 100 kelime)
 * Hedef  : word_translations tablosu
 *
 * Görev 1 — PT çevirileri: her kelime için target_lang='pt' kaydını
 *            upsert eder (translation, alt_translations, example_target).
 * Görev 2 — ES güncellemesi: example_source / example_target boşsa
 *            translations.json'daki es_example ile doldurur;
 *            es_alt varsa alt_translations günceller.
 * Görev 3 — Eksik kelime raporu: verbs-a1.json'da olup
 *            translations.json'da olmayanları listeler.
 *
 * Çalıştır: node src/db/seedPT.js
 */

import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join }  from 'path'
import { getDb, closeDb } from './db.js'

const require   = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))

const TRANS_PATH = join(__dirname, '..', '..', 'translations.json')
const VERBS_PATH = join(__dirname, '..', 'data', 'verbs-a1.json')

// ── Veri yükle ────────────────────────────────────────────
const translations = require(TRANS_PATH)          // [{word, es, es_alt, pt, pt_alt, es_example, pt_example}]
const verbsRaw     = require(VERBS_PATH)
const verbWords    = verbsRaw.words               // [{id, en, es, pt, pron, ...}]

// translations.json'ı word → obje şeklinde map'le
const transMap = new Map(translations.map(t => [t.word.toLowerCase(), t]))

// verbs-a1.json'daki tüm kelime adları
const verbSet = new Set(verbWords.map(w => w.en.toLowerCase()))

console.log('═'.repeat(56))
console.log('AguiLangEvo · seedPT — PT çevirileri + ES örnekler')
console.log('═'.repeat(56))
console.log(`translations.json  : ${translations.length} kelime`)
console.log(`verbs-a1.json      : ${verbWords.length} kelime`)

// ── Eksik kelimeler (Görev 3) ─────────────────────────────
const missing = verbWords
  .filter(w => !transMap.has(w.en.toLowerCase()))
  .map(w => w.en)

console.log(`\n[Görev 3] Eksik kelimeler (${missing.length} adet):`)
console.log('  ' + missing.join(', '))

// ── DB bağlan (migration 004 de bu noktada çalışır) ───────
const db = getDb()

// ── Prepared statements ───────────────────────────────────
const getWordId = db.prepare(
  'SELECT id FROM words WHERE LOWER(word) = LOWER(?) AND language_id = ?'
)

const upsertPT = db.prepare(`
  INSERT INTO word_translations
    (word_id, target_lang, translation, alt_translations,
     example_target, validated_by, confidence)
  VALUES
    (@word_id, 'pt', @translation, @alt_translations,
     @example_target, @validated_by, @confidence)
  ON CONFLICT(word_id, target_lang) DO UPDATE SET
    translation      = excluded.translation,
    alt_translations = excluded.alt_translations,
    example_target   = excluded.example_target,
    validated_by     = excluded.validated_by,
    confidence       = excluded.confidence
`)

const updateES = db.prepare(`
  UPDATE word_translations SET
    alt_translations = CASE
      WHEN @alt_translations IS NOT NULL THEN @alt_translations
      ELSE alt_translations
    END,
    example_source = CASE
      WHEN (example_source IS NULL OR example_source = '') AND @example_source IS NOT NULL
      THEN @example_source ELSE example_source
    END,
    example_target = CASE
      WHEN (example_target IS NULL OR example_target = '') AND @example_target IS NOT NULL
      THEN @example_target ELSE example_target
    END
  WHERE word_id = @word_id AND target_lang = 'es'
`)

// ── Ana döngü ─────────────────────────────────────────────
let ptInserted   = 0
let ptSkipped    = 0   // DB'de word_id bulunamadı
let esUpdated    = 0
let esSkipped    = 0   // translations.json'da değil veya verbs-a1 kapsamı dışı
const errors     = []

db.transaction(() => {
  for (const t of translations) {
    const key    = t.word.toLowerCase()
    const wordId = getWordId.get(key, 'en')?.id

    if (!wordId) {
      // Bu kelime words tablosunda yok (verbs-a1'de olmayan çeviriler)
      ptSkipped++
      esSkipped++
      continue
    }

    // ─── Görev 1: PT upsert ───────────────────────────────
    const ptMain = (t.pt || '').trim()
    if (ptMain) {
      const ptAlt = (t.pt_alt || '').trim()
      upsertPT.run({
        word_id:          wordId,
        translation:      ptMain,
        alt_translations: ptAlt ? JSON.stringify([ptAlt]) : null,
        example_target:   (t.pt_example || '').trim() || null,
        validated_by:     'mymemory',
        confidence:       0.85,
      })
      ptInserted++
    }

    // ─── Görev 2: ES güncelle ─────────────────────────────
    const esAlt  = (t.es_alt || '').trim()
    const esEx   = (t.es_example || '').trim()
    const result = updateES.run({
      word_id:          wordId,
      alt_translations: esAlt ? JSON.stringify([esAlt]) : null,
      example_source:   null,          // İngilizce örnek cümle şimdilik yok
      example_target:   esEx || null,
    })
    if (result.changes > 0) esUpdated++
  }
})()

// ── Sonuç raporu ──────────────────────────────────────────
console.log('\n' + '─'.repeat(56))
console.log('[Sonuç]')
console.log('─'.repeat(56))
console.log(`  PT eklendi / güncellendi : ${ptInserted} kayıt`)
console.log(`  ES güncellendi           : ${esUpdated} kayıt`)
console.log(`  Kelime DB'de bulunamadı  : ${ptSkipped} adet (words tablosunda yok)`)

if (errors.length > 0) {
  console.log(`\n  ⚠️  Hata (${errors.length}):`)
  errors.forEach(e => console.log(`    - ${e.word}: ${e.error}`))
} else {
  console.log('\n  Hata: YOK')
}

// ── DB doğrulama sorguları ────────────────────────────────
console.log('\n' + '─'.repeat(56))
console.log('[DB Doğrulama]')
console.log('─'.repeat(56))

const langCounts = db.prepare(`
  SELECT target_lang, COUNT(*) AS count
  FROM word_translations
  GROUP BY target_lang
  ORDER BY target_lang
`).all()

console.log('\n  target_lang  |  kayıt')
console.log('  ' + '-'.repeat(24))
langCounts.forEach(r =>
  console.log(`  ${r.target_lang.padEnd(12)} |  ${r.count}`)
)

const ptSample = db.prepare(`
  SELECT w.word, wt.translation, wt.alt_translations, wt.example_target
  FROM word_translations wt
  JOIN words w ON w.id = wt.word_id
  WHERE wt.target_lang = 'pt'
  LIMIT 5
`).all()

console.log('\n  [PT örnekleri — ilk 5]')
ptSample.forEach(r => {
  const alts = r.alt_translations ? JSON.parse(r.alt_translations).join(', ') : '—'
  console.log(`  ${r.word.padEnd(14)} → ${r.translation.padEnd(16)} (alt: ${alts})`)
  if (r.example_target) console.log(`    ex: "${r.example_target}"`)
})

const esSample = db.prepare(`
  SELECT w.word, wt.translation, wt.alt_translations, wt.example_target
  FROM word_translations wt
  JOIN words w ON w.id = wt.word_id
  WHERE wt.target_lang = 'es' AND wt.example_target IS NOT NULL
  LIMIT 5
`).all()

console.log('\n  [ES örnek cümleli kayıtlar — ilk 5]')
esSample.forEach(r => {
  const alts = r.alt_translations ? JSON.parse(r.alt_translations).join(', ') : '—'
  console.log(`  ${r.word.padEnd(14)} → ${r.translation.padEnd(16)} (alt: ${alts})`)
  if (r.example_target) console.log(`    ex: "${r.example_target}"`)
})

console.log('\n' + '═'.repeat(56))
console.log('seedPT tamamlandı ✅')
console.log('═'.repeat(56))

closeDb()
