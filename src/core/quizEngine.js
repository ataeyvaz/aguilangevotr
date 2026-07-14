/**
 * core/quizEngine.js — Üç modlu quiz üretici (Faz B)
 *
 * Kartlardan (toCard çıktısı) dinamik quiz üretir. İçerik büyüdükçe
 * ayrı quiz dosyası yazmaya gerek yok — kelime havuzundan üretilir.
 *
 * Modlar:
 *   'mcq'     → çoktan seçmeli (TR görülür, hedef dil seçilir)
 *   'written' → yazılı (TR görülür, hedef dil yazılır → fuzzyMatch)
 *   'audio'   → sesli (hedef dil seslendirilir, doğrusu seçilir/yazılır)
 *
 * Karışık mod: modes: ['mcq','written','audio'] → her soru rastgele mod.
 */
import { checkAnswer } from '../utils/fuzzyMatch'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Bir kart için yanıltıcı (distractor) hedef kelimeler seç. */
function distractors(card, pool, n = 3) {
  const same = pool.filter(c => c.id !== card.id && c.target && c.target !== card.target)
  // Aynı kategoriyi önceliklendir (daha zorlayıcı)
  const sameCat = same.filter(c => c.category === card.category)
  const chosen = shuffle(sameCat.length >= n ? sameCat : same).slice(0, n)
  return chosen.map(c => c.target)
}

/**
 * Tek soru üretir.
 * @param {object} card  aktif kart
 * @param {object[]} pool  distractor havuzu (tüm kartlar)
 * @param {string} mode  'mcq'|'written'|'audio'
 */
export function buildQuestion(card, pool, mode = 'mcq') {
  const base = {
    id: card.id,
    mode,
    source: card.source,       // TR ipucu
    answer: card.target,       // doğru cevap (hedef dil)
    emoji: card.emoji,
    ipa: card.ipa,
    audioText: card.target,    // seslendirilecek metin
  }

  if (mode === 'written') {
    return { ...base, prompt: card.source, needsInput: true }
  }

  if (mode === 'audio') {
    // Sesli: hedef dili dinle → seçenekten bul (varsayılan seçmeli)
    const opts = shuffle([card.target, ...distractors(card, pool, 3)])
    return { ...base, prompt: '🔊 Dinle ve doğru kelimeyi seç', options: opts, autoPlay: true }
  }

  // mcq
  const opts = shuffle([card.target, ...distractors(card, pool, 3)])
  return { ...base, prompt: card.source, options: opts }
}

/**
 * Bir quiz oturumu üretir.
 * @param {object[]} cards  sorulacak kartlar (zaten seçilmiş, örn. getDue)
 * @param {object} opts { modes?: string[], pool?: cards, count?: number }
 */
export function buildQuiz(cards, { modes = ['mcq'], pool = null, count = 10 } = {}) {
  const usePool = pool || cards
  const selected = shuffle(cards).slice(0, count)
  return selected.map(card => {
    const mode = modes[Math.floor(Math.random() * modes.length)]
    return buildQuestion(card, usePool, mode)
  })
}

/**
 * Cevabı değerlendirir.
 * @param {object} question buildQuestion çıktısı
 * @param {string} given kullanıcı cevabı (seçilen metin veya yazılan)
 * @returns { correct, score, expected }
 */
export function grade(question, given) {
  const expected = question.answer
  if (question.needsInput) {
    const r = checkAnswer(given || '', expected)
    return { correct: r.match, score: Math.round((r.score || 0) * 100), expected, suggestion: r.suggestion }
  }
  const correct = (given || '').trim().toLowerCase() === expected.trim().toLowerCase()
  return { correct, score: correct ? 100 : 0, expected }
}

export const QUIZ_MODES = {
  mcq:     { id: 'mcq',     label: 'Çoktan Seçmeli', emoji: '🔠' },
  written: { id: 'written', label: 'Yazılı',         emoji: '⌨️' },
  audio:   { id: 'audio',   label: 'Sesli',          emoji: '🔊' },
}
