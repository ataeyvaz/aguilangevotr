const STORAGE_KEY = 'aguilang_grammar_progress'

/**
 * loadLesson — grammar JSON dosyasını dinamik import ile yükler
 */
export async function loadLesson(lang, lessonNumber) {
  const mod = await import(`../data/grammar/${lang}/lesson-${lessonNumber}.json`)
  return mod.default
}

/**
 * saveProgress — bir dersin ilerleme durumunu kaydeder
 */
export function saveProgress(lessonId, step, completed = false) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    all[lessonId] = {
      completed,
      currentStep: step,
      completedAt: completed ? new Date().toISOString().split('T')[0] : (all[lessonId]?.completedAt || null),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    window.dispatchEvent(new Event('grammarProgressUpdated'))
  } catch { /* ignore */ }
}

/**
 * getProgress — tek bir dersin ilerleme durumu
 * @returns {{ completed: boolean, currentStep: number, completedAt: string|null }}
 */
export function getProgress(lessonId) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return all[lessonId] || { completed: false, currentStep: 0, completedAt: null }
  } catch {
    return { completed: false, currentStep: 0, completedAt: null }
  }
}

/**
 * getAllProgress — bir dildeki tüm derslerin özeti
 * @returns {{ total: number, completed: number, lessons: object[] }}
 */
export function getAllProgress(lang) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    const lessons = Array.from({ length: 6 }, (_, i) => {
      const lessonId = `${lang}-lesson-${i + 1}`
      return { lessonId, ...(all[lessonId] || { completed: false, currentStep: 0, completedAt: null }) }
    })
    const completed = lessons.filter(l => l.completed).length
    return { total: 6, completed, lessons }
  } catch {
    return { total: 6, completed: 0, lessons: [] }
  }
}
