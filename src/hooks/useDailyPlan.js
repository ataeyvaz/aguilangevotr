const STORAGE_KEY = 'aguilang_daily_plan'

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export const DEFAULT_WEEKLY_PLAN = {
  monday:    { categoryId: 'animals',  langId: 'en', cardLimit: 10, durationMinutes: 15, quizEnabled: true,  gameEnabled: false },
  tuesday:   { categoryId: 'colors',   langId: 'en', cardLimit: 10, durationMinutes: 15, quizEnabled: true,  gameEnabled: false },
  wednesday: { categoryId: 'numbers',  langId: 'en', cardLimit: 10, durationMinutes: 15, quizEnabled: false, gameEnabled: true  },
  thursday:  { categoryId: 'family',   langId: 'en', cardLimit: 10, durationMinutes: 15, quizEnabled: true,  gameEnabled: false },
  friday:    { categoryId: 'food',     langId: 'en', cardLimit: 10, durationMinutes: 15, quizEnabled: false, gameEnabled: true  },
  saturday:  { categoryId: 'fruits',   langId: 'en', cardLimit: 10, durationMinutes: 15, quizEnabled: true,  gameEnabled: false },
  sunday:    { categoryId: 'animals',  langId: 'en', cardLimit: 10, durationMinutes: 15, quizEnabled: false, gameEnabled: true  },
}

/**
 * useDailyPlan — Günlük plan yönetimi
 * Ebeveyn planını localStorage'dan okur, bugünkü planı döner.
 */
export function useDailyPlan() {
  const loadPlan = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      // Varsayılan plan üzerine ebeveyn planını uygula
      const merged = {}
      for (const day of DAY_NAMES) {
        merged[day] = { ...DEFAULT_WEEKLY_PLAN[day], ...(saved[day] ?? {}) }
      }
      return merged
    } catch {
      return { ...DEFAULT_WEEKLY_PLAN }
    }
  }

  const weeklyPlan = loadPlan()
  const todayName  = DAY_NAMES[new Date().getDay()]
  const todayPlan  = weeklyPlan[todayName] ?? DEFAULT_WEEKLY_PLAN.monday

  /** Tüm haftalık planı localStorage'a kaydet */
  const savePlan = (plan) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan))
  }

  /** Tek bir gün için planı güncelle */
  const updateDay = (dayName, dayPlan) => {
    const current = loadPlan()
    current[dayName] = { ...current[dayName], ...dayPlan }
    savePlan(current)
  }

  return {
    todayPlan,
    todayName,
    weeklyPlan,
    savePlan,
    updateDay,
    DAY_NAMES,
  }
}
