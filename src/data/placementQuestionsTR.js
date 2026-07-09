/**
 * Placement test soruları — TR kaynak dil.
 * words-tr-a1.json kelimelerinden üretildi.
 * 15 soru: 8×TR→EN (A1) | 4×TR→ES (A1) | 3×TR→PT (A2)
 */

// Fisher-Yates shuffle
export function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const RAW_QUESTIONS = [

  // ── A1 — TR → İngilizce (8 soru) ─────────────────────
  { id: 1,  cefr_level: 'A1', skill_area: 'kelime',
    question: "'ekmek' kelimesinin İngilizcesi nedir?",
    answer: 'bread',
    distractors: ['milk', 'egg', 'rice'] },

  { id: 2,  cefr_level: 'A1', skill_area: 'kelime',
    question: "'kedi' kelimesinin İngilizcesi nedir?",
    answer: 'cat',
    distractors: ['dog', 'fish', 'bird'] },

  { id: 3,  cefr_level: 'A1', skill_area: 'kelime',
    question: "'kırmızı' kelimesinin İngilizcesi nedir?",
    answer: 'red',
    distractors: ['blue', 'green', 'yellow'] },

  { id: 4,  cefr_level: 'A1', skill_area: 'kelime',
    question: "'anne' kelimesinin İngilizcesi nedir?",
    answer: 'mother',
    distractors: ['father', 'sister', 'brother'] },

  { id: 5,  cefr_level: 'A1', skill_area: 'kelime',
    question: "'el' kelimesinin İngilizcesi nedir?",
    answer: 'hand',
    distractors: ['eye', 'nose', 'ear'] },

  { id: 6,  cefr_level: 'A1', skill_area: 'kelime',
    question: "'araba' kelimesinin İngilizcesi nedir?",
    answer: 'car',
    distractors: ['bus', 'train', 'bicycle'] },

  { id: 7,  cefr_level: 'A1', skill_area: 'kelime',
    question: "'elma' kelimesinin İngilizcesi nedir?",
    answer: 'apple',
    distractors: ['banana', 'orange', 'strawberry'] },

  { id: 8,  cefr_level: 'A1', skill_area: 'kelime',
    question: "'kitap' kelimesinin İngilizcesi nedir?",
    answer: 'book',
    distractors: ['pen', 'pencil', 'bag'] },

  // ── A1 — TR → İspanyolca (4 soru) ────────────────────
  { id: 9,  cefr_level: 'A1', skill_area: 'kelime',
    question: "'süt' kelimesinin İspanyolcası nedir?",
    answer: 'leche',
    distractors: ['pan', 'huevo', 'arroz'] },

  { id: 10, cefr_level: 'A1', skill_area: 'kelime',
    question: "'köpek' kelimesinin İspanyolcası nedir?",
    answer: 'perro',
    distractors: ['gato', 'pez', 'pájaro'] },

  { id: 11, cefr_level: 'A1', skill_area: 'kelime',
    question: "'mavi' kelimesinin İspanyolcası nedir?",
    answer: 'azul',
    distractors: ['rojo', 'verde', 'amarillo'] },

  { id: 12, cefr_level: 'A1', skill_area: 'kelime',
    question: "'baba' kelimesinin İspanyolcası nedir?",
    answer: 'padre',
    distractors: ['madre', 'hermano', 'hermana'] },

  // ── A2 — TR → Portekizce (3 soru) ────────────────────
  { id: 13, cefr_level: 'A2', skill_area: 'kelime',
    question: "'yumurta' kelimesinin Portekizcesi nedir?",
    answer: 'ovo',
    distractors: ['pão', 'leite', 'frango'] },

  { id: 14, cefr_level: 'A2', skill_area: 'kelime',
    question: "'balık' kelimesinin Portekizcesi nedir?",
    answer: 'peixe',
    distractors: ['gato', 'cachorro', 'coelho'] },

  { id: 15, cefr_level: 'A2', skill_area: 'kelime',
    question: "'kalem' kelimesinin Portekizcesi nedir?",
    answer: 'caneta',
    distractors: ['livro', 'lápis', 'mochila'] },

]

/**
 * Soruları ve seçenekleri karıştırır.
 * React componentinde useMemo içinde çağır.
 *
 * @returns {{ id, question, options: string[], correctIndex: number,
 *             cefr_level, skill_area }[]}
 */
export function getPreparedQuestions() {
  return shuffleArray(RAW_QUESTIONS).map(q => {
    const options      = shuffleArray([q.answer, ...q.distractors])
    const correctIndex = options.indexOf(q.answer)
    return {
      id: q.id, question: q.question, options, correctIndex,
      cefr_level: q.cefr_level, skill_area: q.skill_area,
    }
  })
}
