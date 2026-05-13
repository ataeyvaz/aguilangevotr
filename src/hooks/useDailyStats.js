const STORAGE_KEY = 'aguilang_daily_stats'

function todayKey() {
  return new Date().toISOString().split('T')[0]
}

function loadAll() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  catch { return {} }
}

function saveAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/** Bugünün kaydını günceller */
export function recordDaily(isCorrect) {
  const all = loadAll()
  const key = todayKey()
  const today = all[key] ?? { seen: 0, correct: 0, wrong: 0, minutes: 0 }
  all[key] = {
    ...today,
    seen:    today.seen + 1,
    correct: today.correct + (isCorrect ? 1 : 0),
    wrong:   today.wrong   + (isCorrect ? 0 : 1),
  }
  saveAll(all)
}

/** Bugünün verisini döner */
export function getTodayStats() {
  const all = loadAll()
  return all[todayKey()] ?? { seen: 0, correct: 0, wrong: 0, minutes: 0 }
}

/**
 * Son N günün verisini döner (eskiden yeniye)
 * Her eleman: { key, dayName, seen, correct, wrong, minutes }
 */
export function getDailyStats(days = 7) {
  const all = loadAll()
  const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    result.push({
      key,
      dayName: DAY_NAMES[d.getDay()],
      ...(all[key] ?? { seen: 0, correct: 0, wrong: 0, minutes: 0 }),
    })
  }
  return result
}
