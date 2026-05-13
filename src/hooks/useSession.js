import { useState, useRef } from 'react'

const STORAGE_STATS   = 'aguilang_word_stats'

function loadStats() {
  try { return JSON.parse(localStorage.getItem(STORAGE_STATS) || '{}') }
  catch { return {} }
}

function saveStats(stats) {
  localStorage.setItem(STORAGE_STATS, JSON.stringify(stats))
}

/**
 * useSession — Oturum takibi + wordStats
 * Kullanım:
 *   const { startSession, recordCard, endSession, sessionData, getHardWords } = useSession()
 */
export function useSession() {
  const sessionRef = useRef(null)
  const [sessionData, setSessionData] = useState(null)

  /** Oturum başlat */
  const startSession = (categoryId, langId) => {
    const session = {
      categoryId,
      langId,
      startTime: Date.now(),
      cardsStudied: 0,
      correct: 0,
      wrong: 0,
      points: 0,
    }
    sessionRef.current = session
    setSessionData({ ...session })
  }

  /**
   * Kart kaydı — wordStats günceller
   * @param {string} wordId
   * @param {boolean} isCorrect
   * @param {number} responseTimeMs
   */
  const recordCard = (wordId, isCorrect, responseTimeMs = 0) => {
    if (!sessionRef.current) return

    // wordStats güncelle
    if (wordId) {
      const stats = loadStats()
      const prev  = stats[wordId] ?? { seen: 0, correct: 0, wrong: 0, totalTime: 0, lastSeen: null }
      const newTotal = (prev.totalTime ?? 0) + responseTimeMs
      const newSeen  = prev.seen + 1
      stats[wordId] = {
        seen:            newSeen,
        correct:         prev.correct + (isCorrect ? 1 : 0),
        wrong:           prev.wrong   + (isCorrect ? 0 : 1),
        totalTime:       newTotal,
        avgResponseTime: Math.round(newTotal / newSeen),
        lastSeen:        new Date().toISOString().split('T')[0],
      }
      saveStats(stats)
    }

    // Session güncelle
    const updated = {
      ...sessionRef.current,
      cardsStudied: sessionRef.current.cardsStudied + 1,
      correct:      sessionRef.current.correct + (isCorrect ? 1 : 0),
      wrong:        sessionRef.current.wrong   + (isCorrect ? 0 : 1),
      points:       sessionRef.current.points  + (isCorrect ? 10 : 3),
    }
    sessionRef.current = updated
    setSessionData({ ...updated })
  }

  /** Oturumu bitir — final data döner */
  const endSession = (cardCount) => {
    const base = sessionRef.current ?? { cardsStudied: 0, correct: 0, wrong: 0, points: 0 }
    const final = {
      ...base,
      cardsStudied:    cardCount ?? base.cardsStudied,
      endTime:         Date.now(),
      durationSeconds: Math.round((Date.now() - (base.startTime ?? Date.now())) / 1000),
    }
    sessionRef.current = final
    setSessionData({ ...final })
    return final
  }

  /** wordStats'tan zor kelimeleri getir (2+ yanlış) */
  const getHardWords = () => {
    const stats = loadStats()
    return Object.entries(stats)
      .filter(([, s]) => s.wrong >= 2)
      .map(([id, s]) => ({ id, ...s }))
      .sort((a, b) => b.wrong - a.wrong)
      .slice(0, 5)
  }

  /** Tüm wordStats'ı getir */
  const getWordStats = () => loadStats()

  return {
    startSession,
    recordCard,
    endSession,
    sessionData,
    getHardWords,
    getWordStats,
  }
}
