/**
 * AguiLangEvo · SRS Engine — SM-2 algoritması (Node.js only)
 *
 * Kullanım: Electron / Capacitor native bridge / Node.js scriptleri.
 * Browser WebView içinde import ETMEYİN.
 *
 * SM-2 referans: Wozniak, 1987
 * ─────────────────────────────────────────────────────────────────
 * Kalite skoru (q):
 *   0 → yanlış (tamamen)
 *   3 → doğru ama zorlandı
 *   4 → doğru, orta güçlük  ← default "isCorrect=true"
 *   5 → doğru, çok kolay
 *
 * ease_factor (EF):
 *   new_EF = max(1.3,  EF + 0.1 − (5−q)·(0.08 + (5−q)·0.02))
 *
 * interval:
 *   rep=1 → 1 gün
 *   rep=2 → 6 gün
 *   rep>2 → round(prev_interval × EF)
 *   q<3   → sıfırla (rep=0, interval=1)
 *
 * status:
 *   rep ≤ 2  → learning
 *   rep 3-5  → review
 *   rep ≥ 6  → mastered
 */

import { getDb } from './db.js'

// ── Yardımcılar ───────────────────────────────────────────

/** Bugünün ISO tarih stringi: '2026-04-29' */
const today = () => new Date().toISOString().split('T')[0]

/** Belirtilen gün kadar ilerideki tarihi döner */
function addDays(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// ── SM-2 çekirdeği ────────────────────────────────────────

/**
 * SM-2 hesaplar, yeni SRS değerlerini döner.
 *
 * @param {{ repetitions: number, ease_factor: number, interval_days: number }} cur
 * @param {0|3|4|5} quality
 * @returns {{ repetitions, ease_factor, interval_days, next_review_date, status }}
 */
function computeSM2(cur, quality) {
  const { repetitions, ease_factor, interval_days } = cur

  // Ease factor güncelle
  const newEF = Math.max(
    1.3,
    ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  )

  let newReps, newInterval

  if (quality < 3) {
    // Yanlış → baştan başla, EF düşük kalır
    newReps     = 0
    newInterval = 1
  } else {
    newReps = repetitions + 1
    if (newReps === 1)      newInterval = 1
    else if (newReps === 2) newInterval = 6
    else                    newInterval = Math.max(1, Math.round(interval_days * newEF))
  }

  // Status
  let status
  if (newReps <= 2)      status = 'learning'
  else if (newReps <= 5) status = 'review'
  else                   status = 'mastered'

  return {
    repetitions:      newReps,
    ease_factor:      Math.round(newEF * 1000) / 1000,   // 3 ondalık
    interval_days:    newInterval,
    next_review_date: addDays(newInterval),
    status,
  }
}

// ── Dışa aktarılan fonksiyonlar ───────────────────────────

/**
 * Tekrar edilecek sonraki kelimeleri getirir.
 *
 * Öncelik sırası:
 *  1. next_review_date <= bugün olan user_progress kayıtları (mastered değil)
 *  2. Henüz hiç görülmemiş kelimeler (user_progress'te yok)
 *
 * @param {number}  profileId
 * @param {number}  pairId     - language_pairs.id
 *                              pair.source_lang → kelimelerin dili
 *                              pair.target_lang → çevirilerin dili
 * @param {number}  [limit=10]
 * @returns {{
 *   word_id: number, word: string, ipa: string|null,
 *   translation: string, alt_translations: string|null,
 *   status: string, repetitions: number,
 *   ease_factor: number, interval_days: number,
 *   next_review_date: string|null
 * }[]}
 */
export function getNextWords(profileId, pairId, limit = 10) {
  const db  = getDb()
  const now = today()

  const pair = db.prepare(
    'SELECT source_lang, target_lang FROM language_pairs WHERE id = ?'
  ).get(pairId)
  if (!pair) throw new Error(`Language pair bulunamadı: ${pairId}`)

  // ── 1. Vadesi gelmiş kelimeler ────────────────────────
  const due = db.prepare(`
    SELECT
      up.word_id,
      w.word,
      w.ipa,
      wt.translation,
      wt.alt_translations,
      up.status,
      up.repetitions,
      up.ease_factor,
      up.interval_days,
      up.next_review_date
    FROM  user_progress    up
    JOIN  words            w   ON  w.id          = up.word_id
    JOIN  word_translations wt ON  wt.word_id    = up.word_id
                               AND wt.target_lang = ?
    WHERE up.profile_id        = ?
      AND up.language_pair_id  = ?
      AND up.status           != 'mastered'
      AND up.next_review_date <= ?
    ORDER BY up.next_review_date ASC
    LIMIT ?
  `).all(pair.target_lang, profileId, pairId, now, limit)

  if (due.length >= limit) return due

  // ── 2. Hiç görülmemiş yeni kelimeler ─────────────────
  const needed = limit - due.length

  const fresh = db.prepare(`
    SELECT
      w.id              AS word_id,
      w.word,
      w.ipa,
      wt.translation,
      wt.alt_translations,
      'new'             AS status,
      0                 AS repetitions,
      2.5               AS ease_factor,
      0                 AS interval_days,
      NULL              AS next_review_date
    FROM  words            w
    JOIN  word_translations wt ON  wt.word_id    = w.id
                               AND wt.target_lang = ?
    WHERE w.language_id = ?
      AND w.id NOT IN (
            SELECT word_id
            FROM   user_progress
            WHERE  profile_id = ? AND language_pair_id = ?
          )
    ORDER BY COALESCE(w.frequency_rank, 9999) ASC, w.id ASC
    LIMIT ?
  `).all(pair.target_lang, pair.source_lang, profileId, pairId, needed)

  return [...due, ...fresh]
}

/**
 * Bir kelimeye verilen cevabı kaydeder, SM-2'yi çalıştırır.
 *
 * @param {number}    profileId
 * @param {number}    wordId
 * @param {number}    pairId
 * @param {boolean}   isCorrect
 * @param {0|3|4|5}   [quality]  — verilmezse isCorrect→4, yanlış→0
 * @returns {{ status, repetitions, ease_factor, interval_days, next_review_date }}
 */
export function recordAnswer(profileId, wordId, pairId, isCorrect, quality) {
  const db = getDb()
  const q  = quality !== undefined ? quality : (isCorrect ? 4 : 0)

  // Mevcut kaydı al (yoksa SM-2 başlangıç değerleri)
  const cur = db.prepare(`
    SELECT repetitions, ease_factor, interval_days
    FROM   user_progress
    WHERE  profile_id = ? AND word_id = ? AND language_pair_id = ?
  `).get(profileId, wordId, pairId) ?? { repetitions: 0, ease_factor: 2.5, interval_days: 0 }

  const srs = computeSM2(cur, q)

  // INSERT veya güncelle — correct/wrong sayaçlarını biriktir
  db.prepare(`
    INSERT INTO user_progress
      (profile_id, word_id, language_pair_id,
       repetitions, ease_factor, interval_days, next_review_date, status,
       correct_count, wrong_count, last_reviewed_at)
    VALUES
      (?, ?, ?,
       ?, ?, ?, ?, ?,
       ?, ?, datetime('now'))
    ON CONFLICT(profile_id, word_id, language_pair_id) DO UPDATE SET
      repetitions      = excluded.repetitions,
      ease_factor      = excluded.ease_factor,
      interval_days    = excluded.interval_days,
      next_review_date = excluded.next_review_date,
      status           = excluded.status,
      correct_count    = user_progress.correct_count + excluded.correct_count,
      wrong_count      = user_progress.wrong_count   + excluded.wrong_count,
      last_reviewed_at = datetime('now')
  `).run(
    profileId, wordId, pairId,
    srs.repetitions, srs.ease_factor, srs.interval_days,
    srs.next_review_date, srs.status,
    isCorrect ? 1 : 0,
    isCorrect ? 0 : 1,
  )

  return srs
}

/**
 * Profil için özet ilerleme istatistiklerini döner.
 *
 * @param {number} profileId
 * @param {number} pairId
 * @returns {{
 *   new: number,       // henüz görülmemiş
 *   learning: number,
 *   review: number,
 *   mastered: number,
 *   todayDue: number,  // bugün vadesi gelen
 *   totalSeen: number,
 *   totalWords: number
 * }}
 */
export function getProgressStats(profileId, pairId) {
  const db  = getDb()
  const now = today()

  const pair = db.prepare(
    'SELECT source_lang FROM language_pairs WHERE id = ?'
  ).get(pairId)
  if (!pair) throw new Error(`Language pair bulunamadı: ${pairId}`)

  // Status dağılımı
  const rows = db.prepare(`
    SELECT status, COUNT(*) AS c
    FROM   user_progress
    WHERE  profile_id = ? AND language_pair_id = ?
    GROUP  BY status
  `).all(profileId, pairId)

  const counts = { learning: 0, review: 0, mastered: 0 }
  rows.forEach(r => { if (r.status in counts) counts[r.status] = r.c })

  const totalSeen = rows.reduce((s, r) => s + r.c, 0)

  // Bugün vadesi gelen sayısı
  const todayDue = db.prepare(`
    SELECT COUNT(*) AS c
    FROM   user_progress
    WHERE  profile_id        = ?
      AND  language_pair_id  = ?
      AND  status           != 'mastered'
      AND  next_review_date <= ?
  `).get(profileId, pairId, now).c

  // Toplam kelime sayısı (kaynak dil)
  const totalWords = db.prepare(`
    SELECT COUNT(*) AS c
    FROM   words
    WHERE  language_id = ?
  `).get(pair.source_lang).c

  return {
    new:        Math.max(0, totalWords - totalSeen),
    learning:   counts.learning,
    review:     counts.review,
    mastered:   counts.mastered,
    todayDue,
    totalSeen,
    totalWords,
  }
}
