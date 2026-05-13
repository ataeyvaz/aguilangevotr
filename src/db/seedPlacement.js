/**
 * AguiLangEvo · Placement Questions Seed
 * 15 soru: 8×A1 (vocabulary) + 7×A2 (grammar + vocabulary)
 * Dil çifti: es→en  (ES konuşanlar EN öğreniyor)
 *
 * Çalıştır: node src/db/seedPlacement.js
 */

import { getDb, closeDb, ensureLanguagePair } from './db.js'

// ── Soru verisi ───────────────────────────────────────────
// answer = doğru cevap
// distractors = JSON, 3 yanlış seçenek
// options sırası UI'da shuffle edilir

const QUESTIONS = [
  // ── A1 Vocabulary (8 soru) ───────────────────────────
  {
    cefr_level: 'A1',
    skill_area: 'vocabulary',
    question:   "What does the English word 'be' mean in Spanish?",
    answer:     'ser / estar',
    distractors: ['tener', 'ir', 'hacer'],
  },
  {
    cefr_level: 'A1',
    skill_area: 'vocabulary',
    question:   "What does the English word 'have' mean in Spanish?",
    answer:     'tener',
    distractors: ['ser', 'ir', 'ver'],
  },
  {
    cefr_level: 'A1',
    skill_area: 'vocabulary',
    question:   "What does the English word 'do' mean in Spanish?",
    answer:     'hacer',
    distractors: ['ir', 'tener', 'venir'],
  },
  {
    cefr_level: 'A1',
    skill_area: 'vocabulary',
    question:   "What does the English word 'go' mean in Spanish?",
    answer:     'ir',
    distractors: ['venir', 'hacer', 'tener'],
  },
  {
    cefr_level: 'A1',
    skill_area: 'vocabulary',
    question:   "What does the English word 'come' mean in Spanish?",
    answer:     'venir',
    distractors: ['ir', 'tener', 'gustar'],
  },
  {
    cefr_level: 'A1',
    skill_area: 'vocabulary',
    question:   "What does the English word 'want' mean in Spanish?",
    answer:     'querer',
    distractors: ['necesitar', 'gustar', 'poder'],
  },
  {
    cefr_level: 'A1',
    skill_area: 'vocabulary',
    question:   "What does the English word 'like' mean in Spanish?",
    answer:     'gustar',
    distractors: ['querer', 'ver', 'hablar'],
  },
  {
    cefr_level: 'A1',
    skill_area: 'vocabulary',
    question:   "What does the English word 'need' mean in Spanish?",
    answer:     'necesitar',
    distractors: ['querer', 'poder', 'saber'],
  },

  // ── A2 Grammar + Vocabulary (7 soru) ─────────────────
  {
    cefr_level: 'A2',
    skill_area: 'grammar',
    question:   "Complete the sentence: 'I ___ to the store yesterday.'",
    answer:     'went',
    distractors: ['go', 'gone', 'going'],
  },
  {
    cefr_level: 'A2',
    skill_area: 'grammar',
    question:   "Complete the sentence: 'She ___ English very well.'",
    answer:     'speaks',
    distractors: ['speak', 'speaking', 'spoken'],
  },
  {
    cefr_level: 'A2',
    skill_area: 'vocabulary',
    question:   "What does the phrasal verb 'give up' mean?",
    answer:     'to stop trying',
    distractors: ['to give a gift', 'to go upstairs', 'to offer something'],
  },
  {
    cefr_level: 'A2',
    skill_area: 'grammar',
    question:   "Complete the sentence: 'If I ___ more time, I would travel.'",
    answer:     'had',
    distractors: ['have', 'has', 'having'],
  },
  {
    cefr_level: 'A2',
    skill_area: 'vocabulary',
    question:   "What does the phrasal verb 'find out' mean?",
    answer:     'to discover information',
    distractors: ['to look for something', 'to get lost', 'to remember'],
  },
  {
    cefr_level: 'A2',
    skill_area: 'grammar',
    question:   "Complete the sentence: 'We have been ___ English for two years.'",
    answer:     'learning',
    distractors: ['learn', 'learned', 'learns'],
  },
  {
    cefr_level: 'A2',
    skill_area: 'vocabulary',
    question:   "What does the phrasal verb 'put off' mean?",
    answer:     'to postpone',
    distractors: ['to switch off a light', 'to push something away', 'to give up'],
  },
]

// ── Seed ─────────────────────────────────────────────────
console.log('─'.repeat(52))
console.log('AguiLangEvo · Placement Questions Seed')
console.log('─'.repeat(52))

const db     = getDb()
const pairId = ensureLanguagePair('es', 'en')   // ES konuşan, EN öğreniyor

console.log(`Dil çifti  : es→en (id: ${pairId})`)
console.log(`Soru sayısı: ${QUESTIONS.length}`)

const insert = db.prepare(`
  INSERT INTO placement_questions
    (question, answer, distractors, cefr_level, language_pair_id, skill_area, order_index)
  VALUES
    (@question, @answer, @distractors, @cefr_level, @language_pair_id, @skill_area, @order_index)
  ON CONFLICT DO NOTHING
`)

let inserted = 0
let skipped  = 0

db.transaction(() => {
  QUESTIONS.forEach((q, i) => {
    const result = insert.run({
      question:         q.question,
      answer:           q.answer,
      distractors:      JSON.stringify(q.distractors),
      cefr_level:       q.cefr_level,
      language_pair_id: pairId,
      skill_area:       q.skill_area,
      order_index:      i,
    })
    result.changes > 0 ? inserted++ : skipped++
  })
})()

// ── Özet ─────────────────────────────────────────────────
const rows = db.prepare(`
  SELECT cefr_level, skill_area, COUNT(*) AS c
  FROM placement_questions
  WHERE language_pair_id = ?
  GROUP BY cefr_level, skill_area
  ORDER BY cefr_level, skill_area
`).all(pairId)

const total = db.prepare(
  'SELECT COUNT(*) AS c FROM placement_questions WHERE language_pair_id = ?'
).get(pairId).c

console.log('\nSonuç:')
console.log(`  Eklenen : ${inserted}  |  Atlanan (duplicate): ${skipped}`)
console.log(`  Toplam  : ${total} soru`)
console.log('\n  Dağılım:')
rows.forEach(r => console.log(`    ${r.cefr_level} · ${r.skill_area.padEnd(10)}: ${r.c} soru`))
console.log('\n  Hata: YOK')
console.log('─'.repeat(52))

closeDb()
