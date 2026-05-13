/**
 * Placement test soruları — browser (React) için statik kopya.
 *
 * TODO: Electron/Capacitor ortamında bunu
 *   import { getPlacementQuestions } from '../db/placementQueries.js'
 * ile değiştir. Şu an SQLite browser'da çalışmadığı için
 * seed verisiyle birebir eşleşen statik liste kullanılıyor.
 */

// Fisher-Yates — her render'da farklı sıra için dışarıda kullanılır
export function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const RAW_QUESTIONS = [
  // ── A1 Vocabulary ────────────────────────────────────
  { id: 1,  cefr_level: 'A1', skill_area: 'vocabulary',
    question: "What does the English word 'be' mean in Spanish?",
    answer: 'ser / estar', distractors: ['tener', 'ir', 'hacer'] },

  { id: 2,  cefr_level: 'A1', skill_area: 'vocabulary',
    question: "What does the English word 'have' mean in Spanish?",
    answer: 'tener', distractors: ['ser', 'ir', 'ver'] },

  { id: 3,  cefr_level: 'A1', skill_area: 'vocabulary',
    question: "What does the English word 'do' mean in Spanish?",
    answer: 'hacer', distractors: ['ir', 'tener', 'venir'] },

  { id: 4,  cefr_level: 'A1', skill_area: 'vocabulary',
    question: "What does the English word 'go' mean in Spanish?",
    answer: 'ir', distractors: ['venir', 'hacer', 'tener'] },

  { id: 5,  cefr_level: 'A1', skill_area: 'vocabulary',
    question: "What does the English word 'come' mean in Spanish?",
    answer: 'venir', distractors: ['ir', 'tener', 'gustar'] },

  { id: 6,  cefr_level: 'A1', skill_area: 'vocabulary',
    question: "What does the English word 'want' mean in Spanish?",
    answer: 'querer', distractors: ['necesitar', 'gustar', 'poder'] },

  { id: 7,  cefr_level: 'A1', skill_area: 'vocabulary',
    question: "What does the English word 'like' mean in Spanish?",
    answer: 'gustar', distractors: ['querer', 'ver', 'hablar'] },

  { id: 8,  cefr_level: 'A1', skill_area: 'vocabulary',
    question: "What does the English word 'need' mean in Spanish?",
    answer: 'necesitar', distractors: ['querer', 'poder', 'saber'] },

  // ── A2 Grammar + Vocabulary ───────────────────────────
  { id: 9,  cefr_level: 'A2', skill_area: 'grammar',
    question: "Complete the sentence: 'I ___ to the store yesterday.'",
    answer: 'went', distractors: ['go', 'gone', 'going'] },

  { id: 10, cefr_level: 'A2', skill_area: 'grammar',
    question: "Complete the sentence: 'She ___ English very well.'",
    answer: 'speaks', distractors: ['speak', 'speaking', 'spoken'] },

  { id: 11, cefr_level: 'A2', skill_area: 'vocabulary',
    question: "What does the phrasal verb 'give up' mean?",
    answer: 'to stop trying', distractors: ['to give a gift', 'to go upstairs', 'to offer something'] },

  { id: 12, cefr_level: 'A2', skill_area: 'grammar',
    question: "Complete the sentence: 'If I ___ more time, I would travel.'",
    answer: 'had', distractors: ['have', 'has', 'having'] },

  { id: 13, cefr_level: 'A2', skill_area: 'vocabulary',
    question: "What does the phrasal verb 'find out' mean?",
    answer: 'to discover information', distractors: ['to look for something', 'to get lost', 'to remember'] },

  { id: 14, cefr_level: 'A2', skill_area: 'grammar',
    question: "Complete the sentence: 'We have been ___ English for two years.'",
    answer: 'learning', distractors: ['learn', 'learned', 'learns'] },

  { id: 15, cefr_level: 'A2', skill_area: 'vocabulary',
    question: "What does the phrasal verb 'put off' mean?",
    answer: 'to postpone', distractors: ['to switch off a light', 'to push something away', 'to give up'] },
]

/**
 * Soruları karıştırır ve her sorunun seçeneklerini shuffle eder.
 * React componentinde useMemo içinde çağır.
 *
 * @returns {{ id, question, options: string[], correctIndex: number,
 *             cefr_level, skill_area }[]}
 */
export function getPreparedQuestions() {
  return shuffleArray(RAW_QUESTIONS).map(q => {
    const options      = shuffleArray([q.answer, ...q.distractors])
    const correctIndex = options.indexOf(q.answer)
    return { id: q.id, question: q.question, options, correctIndex,
             cefr_level: q.cefr_level, skill_area: q.skill_area }
  })
}
