import { useState, useCallback, useEffect } from 'react'

export const BADGE_DEFS = [
  { id: 'first_card',   icon: '🃏', name: 'First Card',       desc: 'You opened your first word card!',  check: (p) => p.totalCards >= 1 },
  { id: 'cards_15',     icon: '🎴', name: 'Card Collector',   desc: 'You saw 15 word cards',             check: (p) => p.totalCards >= 15 },
  { id: 'first_quiz',   icon: '🎯', name: 'First Quiz',       desc: 'You completed your first quiz',     check: (p) => p.totalQuizzes >= 1 },
  { id: 'perfect_quiz', icon: '💯', name: 'Perfect',          desc: 'You scored 100% on a quiz!',        check: (p) => p.perfectQuizzes >= 1 },
  { id: 'streak_3',     icon: '🔥', name: '3-Day Streak',     desc: 'You played 3 days in a row',        check: (p) => p.streak >= 3 },
  { id: 'streak_7',     icon: '⭐', name: '7-Day Streak',     desc: 'You played 7 days in a row',        check: (p) => p.streak >= 7 },
  { id: 'all_games',    icon: '🎮', name: 'Game Master',      desc: 'You played 5 different games',      check: (p) => p.gamesPlayed.length >= 5 },
  { id: 'explorer',     icon: '🌍', name: 'Explorer',         desc: 'You tried 3 different languages',   check: (p) => p.languagesUsed.length >= 3 },
  { id: 'points_100',      icon: '💎', name: '100 Points',    desc: 'You earned 100 total points',       check: (p) => p.totalPoints >= 100 },
  { id: 'points_500',      icon: '👑', name: '500 Points',    desc: 'You earned 500 total points',       check: (p) => p.totalPoints >= 500 },
  { id: 'grammar_starter', icon: '📐', name: 'Grammar Starter', desc: 'You completed your first grammar lesson!', check: (p) => p.grammarCompleted >= 1 },
  { id: 'grammar_master',  icon: '🏛️', name: 'Grammar Master', desc: 'You completed all 6 grammar lessons!',    check: (p) => p.grammarCompleted >= 6 },
]

const STORAGE_KEY = 'aguilang_progress_v2'

const DEFAULT = {
  totalPoints: 0,
  totalCards: 0,
  totalQuizzes: 0,
  perfectQuizzes: 0,
  streak: 0,
  lastPlayed: null,
  gamesPlayed: [],
  languagesUsed: [],
  earnedBadges: [],
  levelUpSeen: false,
  quizHistory: [],   // [{score,correct,total,perfect,date,langId}] max 20
  hardWords: {},       // {wordId: failCount}
  todayCards: 0,       // bugün görülen kart (sıfırlanır her gün)
  todayDate: null,     // today string, günlük sıfırlama için
  grammarCompleted: 0, // tamamlanan gramer dersi sayısı
}

function calcStreak(p) {
  const today = new Date().toISOString().split('T')[0]
  if (!p.lastPlayed) return { ...p, streak: 1, lastPlayed: today }
  const diff = Math.round((new Date(today) - new Date(p.lastPlayed)) / 86400000)
  if (diff === 0) return p
  if (diff === 1) return { ...p, streak: p.streak + 1, lastPlayed: today }
  return { ...p, streak: 1, lastPlayed: today }
}

function checkBadges(p) {
  const newIds = BADGE_DEFS
    .filter(b => !p.earnedBadges.includes(b.id) && b.check(p))
    .map(b => b.id)
  return newIds.length ? { ...p, earnedBadges: [...p.earnedBadges, ...newIds] } : p
}

function loadProfile(profileId) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return { ...DEFAULT, ...(all[profileId] || {}) }
  } catch { return { ...DEFAULT } }
}

function saveProfile(profileId, data) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    all[profileId] = data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {}
}

export function useProgress(profileId) {
  const [progress, setRaw] = useState(() => loadProfile(profileId))

  // Profil değişince yeniden yükle
  useEffect(() => {
    if (profileId) setRaw(loadProfile(profileId))
  }, [profileId])

  const mutate = useCallback((fn) => {
    if (!profileId) return
    setRaw(prev => {
      let next = fn(prev)
      next = calcStreak(next)
      next = checkBadges(next)
      saveProfile(profileId, next)
      return next
    })
  }, [profileId])

  const recordCards    = useCallback((n = 1) =>
    mutate(p => {
      const today = new Date().toISOString().split('T')[0]
      const todayCards = p.todayDate === today ? p.todayCards + n : n
      return { ...p, totalCards: p.totalCards + n, todayCards, todayDate: today }
    }), [mutate])

  const recordQuiz = useCallback(({ points, perfect = false, results = [], langId = null }) =>
    mutate(p => {
      // Zor kelime takibi
      const hardWords = { ...p.hardWords }
      results.forEach(r => {
        if (!r.correct) {
          hardWords[r.word.id] = (hardWords[r.word.id] || 0) + 1
        } else if (hardWords[r.word.id]) {
          hardWords[r.word.id] = Math.max(0, hardWords[r.word.id] - 1)
          if (hardWords[r.word.id] === 0) delete hardWords[r.word.id]
        }
      })
      const entry = {
        score: points,
        correct: results.filter(r => r.correct).length,
        total: results.length || 1,
        perfect,
        date: new Date().toISOString().split('T')[0],
        langId,
      }
      return {
        ...p,
        totalPoints:    p.totalPoints + Math.max(0, points),
        totalQuizzes:   p.totalQuizzes + 1,
        perfectQuizzes: p.perfectQuizzes + (perfect ? 1 : 0),
        quizHistory:    [entry, ...p.quizHistory].slice(0, 20),
        hardWords,
      }
    }), [mutate])

  const recordGame     = useCallback((gameId) =>
    mutate(p => ({
      ...p,
      gamesPlayed: p.gamesPlayed.includes(gameId)
        ? p.gamesPlayed : [...p.gamesPlayed, gameId],
    })), [mutate])

  const recordLanguage = useCallback((langId) =>
    mutate(p => ({
      ...p,
      languagesUsed: p.languagesUsed.includes(langId)
        ? p.languagesUsed : [...p.languagesUsed, langId],
    })), [mutate])

  const recordGrammar  = useCallback(() =>
    mutate(p => ({ ...p, grammarCompleted: (p.grammarCompleted || 0) + 1 })), [mutate])

  const markLevelUpSeen = useCallback(() =>
    mutate(p => ({ ...p, levelUpSeen: true })), [mutate])

  const shouldLevelUp =
    !progress.levelUpSeen &&
    progress.totalCards >= 15 &&
    progress.totalQuizzes >= 1

  return {
    progress,
    recordCards, recordQuiz, recordGame, recordLanguage, recordGrammar, markLevelUpSeen,
    shouldLevelUp,
    earnedBadges: BADGE_DEFS.filter(b => progress.earnedBadges.includes(b.id)),
    allBadges: BADGE_DEFS,
  }
}
