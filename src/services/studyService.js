/**
 * AguiLangEvo · Study Service (browser-compatible)
 *
 * SM-2 algoritmasını localStorage üzerinde çalıştırır.
 * Electron/Capacitor'da bu modül srsEngine.js ile swap edilecek.
 *
 * localStorage anahtarları:
 *   aguilang_srs_progress  → { [wordId]: SRSState }
 *   aguilang_srs_stats     → { new, learning, review, mastered, todayDue }
 */

const SRS_KEY   = 'aguilang_srs_progress'
const STATS_KEY = 'aguilang_srs_stats'

// ── Zaman yardımcıları ────────────────────────────────────
const today   = () => new Date().toISOString().split('T')[0]
const addDays = (n) => {
  const d = new Date(); d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

// ── SM-2 çekirdeği ────────────────────────────────────────
function computeSM2(cur, quality) {
  const repetitions  = cur.repetitions  ?? 0
  const ease_factor  = cur.ease_factor  ?? 2.5
  const interval_days = cur.interval_days ?? 0

  const newEF = Math.max(
    1.3,
    ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  )

  let newReps, newInterval
  if (quality < 3) {
    newReps = 0; newInterval = 1
  } else {
    newReps = repetitions + 1
    if (newReps === 1)      newInterval = 1
    else if (newReps === 2) newInterval = 6
    else                    newInterval = Math.max(1, Math.round(interval_days * newEF))
  }

  let status
  if (newReps <= 2)      status = 'learning'
  else if (newReps <= 5) status = 'review'
  else                   status = 'mastered'

  return {
    repetitions:      newReps,
    ease_factor:      Math.round(newEF * 1000) / 1000,
    interval_days:    newInterval,
    next_review_date: addDays(newInterval),
    status,
  }
}

// ── localStorage I/O ──────────────────────────────────────
function loadProgress() {
  try { return JSON.parse(localStorage.getItem(SRS_KEY) || '{}') }
  catch { return {} }
}

function saveProgress(data) {
  localStorage.setItem(SRS_KEY, JSON.stringify(data))
}

// ── Dışa aktarılan fonksiyonlar ───────────────────────────

/**
 * Çalışılacak sonraki kelimeleri döner.
 * Önce vadesi gelenler, sonra yeni kelimeler.
 *
 * @param {object[]} allWords   verbs-a1.json "words" dizisi
 * @param {string}   targetLang 'es' | 'pt'
 * @param {number}   limit
 * @returns {{ id, word, ipa, translation, status }[]}
 */
export function getNextStudyWords(allWords, targetLang = 'es', limit = 10) {
  const progress = loadProgress()
  const now      = today()

  const due = allWords.filter(w => {
    const p = progress[w.id]
    return p && p.status !== 'mastered' && p.next_review_date && p.next_review_date <= now
  })

  const fresh = allWords.filter(w => !progress[w.id])

  let pool = [...due, ...fresh]

  // Tüm kelimeler ya mastered ya gelecekte → yarın vadesi olanlara bak
  if (pool.length === 0) {
    pool = allWords.filter(w => progress[w.id]?.status !== 'mastered')
  }

  return pool.slice(0, limit).map(w => ({
    id:          w.id,
    word:        w.en,
    ipa:         w.pron  || null,
    translation: w[targetLang] || '—',
    status:      progress[w.id]?.status || 'new',
  }))
}

/**
 * Cevabı kaydeder, SM-2 çalıştırır.
 *
 * @param {string}  wordId
 * @param {boolean} isCorrect
 * @param {number}  [quality]  0|2|3|4|5 — verilmezse isCorrect→4, yanlış→0
 * @returns {{ status, repetitions, ease_factor, interval_days, next_review_date }}
 */
export function recordStudyAnswer(wordId, isCorrect, quality) {
  const progress = loadProgress()
  const cur      = progress[wordId] ?? {}
  const q        = quality !== undefined ? quality : (isCorrect ? 4 : 0)
  const srs      = computeSM2(cur, q)

  progress[wordId] = {
    ...srs,
    correct_count:   (cur.correct_count   ?? 0) + (isCorrect ? 1 : 0),
    wrong_count:     (cur.wrong_count     ?? 0) + (isCorrect ? 0 : 1),
    last_reviewed_at: new Date().toISOString(),
  }

  saveProgress(progress)
  return srs
}

/**
 * Toplam ilerleme istatistiklerini hesaplar ve localStorage'a yazar.
 * Dashboard'un aguilang_srs_stats anahtarını günceller.
 *
 * @param {object[]} allWords
 * @returns {{ new, learning, review, mastered, todayDue, totalWords }}
 */
export function computeStudyStats(allWords) {
  const progress = loadProgress()
  const now      = today()

  let counts = { new: 0, learning: 0, review: 0, mastered: 0 }
  let todayDue = 0

  allWords.forEach(w => {
    const p = progress[w.id]
    if (!p) { counts.new++; return }
    counts[p.status] = (counts[p.status] ?? 0) + 1
    if (p.status !== 'mastered' && p.next_review_date && p.next_review_date <= now) {
      todayDue++
    }
  })

  const stats = { ...counts, todayDue, totalWords: allWords.length }
  localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  return stats
}
