import { useState, useCallback, useEffect } from 'react'
import {
  getBadgeStats, awardBadges,
  recordGrammarDone, recordQuizDone,
} from '../core/progressStore'

// ─── Rozet tanımları (Türkçe) ─────────────────────────────
export const BADGE_DEFS = [
  { id: 'first_card',   icon: '🃏', name: 'İlk Kart',         desc: 'İlk kelime kartını açtın!',        check: (p) => p.totalCards >= 1 },
  { id: 'cards_15',     icon: '🎴', name: 'Kart Koleksiyoncusu', desc: '15 kelime kartı gördün',        check: (p) => p.totalCards >= 15 },
  { id: 'cards_50',     icon: '📚', name: 'Kelime Avcısı',    desc: '50 kelime çalıştın',               check: (p) => p.totalCards >= 50 },
  { id: 'first_quiz',   icon: '🎯', name: 'İlk Quiz',         desc: 'İlk quizini tamamladın',           check: (p) => p.totalQuizzes >= 1 },
  { id: 'perfect_quiz', icon: '💯', name: 'Kusursuz',         desc: 'Bir quizde tam puan aldın!',       check: (p) => p.perfectQuizzes >= 1 },
  { id: 'scenario_1',   icon: '🎬', name: 'İlk Senaryo',      desc: 'İlk senaryonu tamamladın!',        check: (p) => p.scenariosDone >= 1 },
  { id: 'scenario_5',   icon: '🎖️', name: 'Senaryo Ustası',   desc: '5 senaryo tamamladın',             check: (p) => p.scenariosDone >= 5 },
  { id: 'streak_3',     icon: '🔥', name: '3 Gün Seri',       desc: '3 gün üst üste çalıştın',          check: (p) => p.streak >= 3 },
  { id: 'streak_7',     icon: '⭐', name: '7 Gün Seri',       desc: '7 gün üst üste çalıştın',          check: (p) => p.streak >= 7 },
  { id: 'explorer',     icon: '🌍', name: 'Kaşif',            desc: '3 farklı dil denedin',             check: (p) => (p.languagesUsed?.length || 0) >= 3 },
  { id: 'points_100',   icon: '💎', name: '100 XP',           desc: '100 XP topladın',                  check: (p) => p.totalPoints >= 100 },
  { id: 'points_500',   icon: '👑', name: '500 XP',           desc: '500 XP topladın',                  check: (p) => p.totalPoints >= 500 },
  { id: 'grammar_starter', icon: '📐', name: 'Gramer Başlangıç', desc: 'İlk gramer dersini tamamladın!', check: (p) => p.grammarCompleted >= 1 },
  { id: 'grammar_master',  icon: '🏛️', name: 'Gramer Ustası',    desc: '6 gramer dersini tamamladın!',   check: (p) => p.grammarCompleted >= 6 },
]

function computeEarned(stats) {
  return BADGE_DEFS.filter(b => b.check(stats)).map(b => b.id)
}

/**
 * useProgress — rozetleri çekirdek progressStore'dan türetir.
 * (profileId artık kullanılmıyor; ilerleme cihaz bazlı tek depoda.)
 */
export function useProgress() {
  const [stats, setStats] = useState(getBadgeStats)

  const refresh = useCallback(() => {
    const s = getBadgeStats()
    awardBadges(computeEarned(s))   // yeni rozetleri kalıcılaştır
    setStats(getBadgeStats())
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const recordGrammar = useCallback(() => { recordGrammarDone(); refresh() }, [refresh])
  const recordQuiz    = useCallback((perfect = false) => { recordQuizDone(perfect); refresh() }, [refresh])

  const earnedIds = computeEarned(stats)
  return {
    progress: stats,
    recordGrammar, recordQuiz, refresh,
    earnedBadges: BADGE_DEFS.filter(b => earnedIds.includes(b.id)),
    allBadges: BADGE_DEFS,
  }
}
