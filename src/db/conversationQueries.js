/**
 * conversationQueries.js — SQLite conversation sorguları (Node.js only)
 *
 * Browser/WebView içinde import ETMEYİN.
 * React tarafı → src/services/conversationService.js kullanır.
 */

import { getDb } from './db.js'

const today = () => new Date().toISOString().split('T')[0]

/**
 * Bir kelimenin packlerini döner.
 * @param {number} wordId
 * @param {'easy'|'medium'|'hard'} difficulty
 */
export function getPacksForWord(wordId, difficulty = 'easy') {
  const db = getDb()
  return db.prepare(`
    SELECT * FROM conversation_packs
    WHERE word_id = ? AND difficulty = ?
    ORDER BY id
  `).all(wordId, difficulty)
}

/**
 * Pack'e ait exchange'leri döner (options JSON parse edilmiş).
 * @param {number} packId
 */
export function getExchanges(packId) {
  const db = getDb()
  return db.prepare(`
    SELECT * FROM conversation_exchanges
    WHERE pack_id = ?
    ORDER BY exchange_order
  `).all(packId).map(ex => ({
    ...ex,
    options: JSON.parse(ex.options),
  }))
}

/**
 * Kullanıcının pack ilerlemesini kaydeder / günceller.
 * @param {number} profileId
 * @param {number} packId
 * @param {number} score      — bu turda kazanılan puan
 */
export function saveProgress(profileId, packId, score) {
  const db = getDb()
  db.prepare(`
    INSERT INTO user_conversation_progress
      (profile_id, pack_id, score, completed, attempts, last_played_at)
    VALUES (?, ?, ?, 1, 1, datetime('now'))
    ON CONFLICT(profile_id, pack_id) DO UPDATE SET
      score          = MAX(excluded.score, score),
      completed      = 1,
      attempts       = attempts + 1,
      last_played_at = excluded.last_played_at
  `).run(profileId, packId, score)
}

/**
 * Bugün çalışılması gereken conversation packlerini döner:
 *   user_progress'te 'learning'/'review' statüsündeki
 *   word_id'lere ait, henüz tamamlanmamış veya 3 günden eski packler.
 * @param {number} profileId
 * @param {number} limit
 */
export function getTodaysPractice(profileId, limit = 5) {
  const db = getDb()
  return db.prepare(`
    SELECT cp.*
    FROM conversation_packs cp
    JOIN user_progress up
      ON up.word_id = cp.word_id
    LEFT JOIN user_conversation_progress ucp
      ON ucp.profile_id = ? AND ucp.pack_id = cp.id
    WHERE up.profile_id = ?
      AND up.status IN ('learning', 'review')
      AND up.next_review_date <= ?
      AND (
        ucp.id IS NULL
        OR ucp.completed = 0
        OR ucp.last_played_at < date('now', '-3 days')
      )
    ORDER BY up.next_review_date ASC
    LIMIT ?
  `).all(profileId, profileId, today(), limit)
}

// ── Session Tracking ──────────────────────────────────────

export function startSession(db, { profileId, packId, languagePairId, totalExchanges }) {
  return db.prepare(`
    INSERT INTO conversation_sessions
      (profile_id, pack_id, language_pair_id, total_exchanges)
    VALUES (?, ?, ?, ?)
  `).run(profileId, packId, languagePairId, totalExchanges).lastInsertRowid
}

export function recordExchange(db, { sessionId, exchangeId, mode, isCorrect, score, pronunciationScore, userAnswer, responseTimeMs }) {
  db.prepare(`
    INSERT INTO session_exchanges
      (session_id, exchange_id, mode, is_correct, score, pronunciation_score, user_answer, response_time_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(sessionId, exchangeId, mode, isCorrect ? 1 : 0, score, pronunciationScore ?? null, userAnswer ?? null, responseTimeMs ?? null)

  db.prepare(`
    UPDATE conversation_sessions
    SET completed_exchanges = completed_exchanges + 1,
        pick_score  = pick_score  + CASE WHEN ? = 'pick'  THEN ? ELSE 0 END,
        type_score  = type_score  + CASE WHEN ? = 'type'  THEN ? ELSE 0 END,
        speak_score = speak_score + CASE WHEN ? = 'speak' THEN ? ELSE 0 END
    WHERE id = ?
  `).run(mode, score, mode, score, mode, score, sessionId)
}

export function endSession(db, sessionId) {
  const s = db.prepare(`
    SELECT pick_score, type_score, speak_score
    FROM conversation_sessions WHERE id = ?
  `).get(sessionId)

  const avgPron = db.prepare(`
    SELECT AVG(pronunciation_score) as avg
    FROM session_exchanges
    WHERE session_id = ? AND pronunciation_score IS NOT NULL
  `).get(sessionId)?.avg ?? 0

  db.prepare(`
    UPDATE conversation_sessions
    SET ended_at = CURRENT_TIMESTAMP,
        total_score = ?,
        avg_pronunciation = ?,
        is_completed = 1
    WHERE id = ?
  `).run((s.pick_score + s.type_score + s.speak_score), avgPron, sessionId)
}

export function getProfileStats(db, profileId) {
  const totals = db.prepare(`
    SELECT
      COUNT(*) as total_sessions,
      SUM(completed_exchanges) as total_exchanges,
      SUM(total_score) as total_score,
      ROUND(AVG(avg_pronunciation), 1) as avg_pronunciation,
      SUM(is_completed) as completed_sessions
    FROM conversation_sessions WHERE profile_id = ?
  `).get(profileId)

  const byMode = db.prepare(`
    SELECT mode,
      COUNT(*) as attempts,
      SUM(is_correct) as correct,
      ROUND(AVG(score), 1) as avg_score
    FROM session_exchanges se
    JOIN conversation_sessions cs ON cs.id = se.session_id
    WHERE cs.profile_id = ?
    GROUP BY mode
  `).all(profileId)

  const recentSessions = db.prepare(`
    SELECT cs.id, cs.started_at, cs.total_score,
           cs.completed_exchanges, cs.avg_pronunciation,
           cs.is_completed, cp.title as pack_title
    FROM conversation_sessions cs
    JOIN conversation_packs cp ON cp.id = cs.pack_id
    WHERE cs.profile_id = ?
    ORDER BY cs.started_at DESC
    LIMIT 10
  `).all(profileId)

  return { totals, byMode, recentSessions }
}
