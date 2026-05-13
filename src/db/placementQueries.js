/**
 * AguiLangEvo · Placement Query Functions (Node.js only)
 * Browser/WebView içinde kullanılamaz — better-sqlite3 Node.js native modülü.
 *
 * Kullanım: Electron, Capacitor native bridge, veya Node.js scripts.
 */

import { getDb } from './db.js'

// ── Fisher-Yates shuffle ──────────────────────────────────
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Placement test sorularını çeker, karıştırır ve seçenekleri hazırlar.
 *
 * @param {number} pairId         - language_pairs.id  (örn: es→en = 3)
 * @param {number} [limit=15]
 * @returns {{ id, question, options: string[], correctIndex: number,
 *             cefr_level, skill_area }[]}
 */
export function getPlacementQuestions(pairId, limit = 15) {
  const db = getDb()

  const rows = db.prepare(`
    SELECT id, question, answer, distractors, cefr_level, skill_area
    FROM   placement_questions
    WHERE  language_pair_id = ?
    ORDER  BY RANDOM()
    LIMIT  ?
  `).all(pairId, limit)

  return rows.map(row => {
    const distractors = JSON.parse(row.distractors)
    const options     = shuffle([row.answer, ...distractors])
    return {
      id:           row.id,
      question:     row.question,
      options,
      correctIndex: options.indexOf(row.answer),
      cefr_level:   row.cefr_level,
      skill_area:   row.skill_area,
    }
  })
}

/**
 * Seviye hesapla: %70+ doğru → A2, altı → A1
 *
 * @param {{ questionId: number, chosen: string, correct: boolean }[]} answers
 * @param {number} total
 * @returns {{ level: 'A1'|'A2', score: number }}  score = 0-100
 */
function computeLevel(answers, total) {
  const correct = answers.filter(a => a.correct).length
  const score   = Math.round((correct / total) * 100)
  return { level: score >= 70 ? 'A2' : 'A1', score }
}

/**
 * Test sonucunu kaydeder, profili günceller.
 *
 * @param {number} profileId
 * @param {number} pairId
 * @param {{ questionId: number, chosen: string, correct: boolean }[]} answers
 * @param {number} [timeSeconds]
 * @returns {{ level: 'A1'|'A2', score: number, correct: number, total: number }}
 */
export function savePlacementResult(profileId, pairId, answers, timeSeconds = null) {
  const db    = getDb()
  const total = answers.length
  const { level, score } = computeLevel(answers, total)

  db.transaction(() => {
    // placement_results tablosuna kaydet
    db.prepare(`
      INSERT INTO placement_results
        (profile_id, language_pair_id, score, cefr_result, answers, time_seconds)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(profileId, pairId, score, level, JSON.stringify(answers), timeSeconds)

    // profiles → current_level ve placement_done güncelle
    db.prepare(`
      UPDATE profiles
      SET current_level   = ?,
          placement_done  = 1
      WHERE id = ?
    `).run(level, profileId)
  })()

  return {
    level,
    score,
    correct: answers.filter(a => a.correct).length,
    total,
  }
}

/**
 * Profilin daha önce placement testi yapıp yapmadığını kontrol eder.
 *
 * @param {number} profileId
 * @returns {boolean}
 */
export function hasCompletedPlacement(profileId) {
  const db = getDb()
  return !!db.prepare(
    'SELECT placement_done FROM profiles WHERE id = ?'
  ).get(profileId)?.placement_done
}
