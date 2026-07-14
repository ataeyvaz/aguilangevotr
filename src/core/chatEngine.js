/**
 * core/chatEngine.js — Senaryo/kalıp tabanlı chatbot motoru (Faz B)
 *
 * İnternetsiz (offline) çalışır — LLM gerektirmez. İki mod:
 *   1) SENARYO modu: sıralı diyalog (bot sorar/söyler, kullanıcı yanıtlar).
 *      Rol değişimi destekli (bkz. scenario şeması).
 *   2) SERBEST modu: bir kelime konusundan bot soru üretir, kullanıcı yanıtlar.
 *
 * Yanıt değerlendirme: fuzzyMatch (yazılı) veya getPronunciationScore (sesli).
 * İleride opsiyonel LLM entegrasyonu için `respond` fonksiyonu tek noktadır.
 */
import { checkAnswer, getPronunciationScore } from '../utils/fuzzyMatch'

const PRAISE = ['Harika! 🎉', 'Süper! 👏', 'Çok iyi! ⭐', 'Mükemmel! 💪', 'Aferin! 🌟']
const RETRY  = ['Az kaldı, tekrar dene 🙂', 'Neredeyse! Bir daha 👊', 'Yaklaştın, dene bakalım 💡']
const random = (arr) => arr[Math.floor(Math.random() * arr.length)]

/**
 * Senaryodan bir sohbet oturumu (state machine) kurar.
 * turns: [{ speaker:'bot'|'user', text:{..}, expect?:{lang→[alts]}, answer?:{..} }]
 */
export function createScenarioSession(scenario, lang = 'en') {
  let idx = 0
  const turns = scenario.turns || scenario.lines || []

  function currentBotLine() {
    // Bot konuşana kadar ilerle, botun repliğini döndür
    while (idx < turns.length && turns[idx].speaker === 'user') break
    const t = turns[idx]
    return t && t.speaker !== 'user' ? { text: t.text?.[lang] || t.text?.en || t[lang], tr: t.text?.tr || t.tr } : null
  }

  return {
    scenario, lang,
    isDone: () => idx >= turns.length,
    peek: () => turns[idx] || null,
    /** Sıradaki botun mesajını al (varsa) ve indeksi ilerlet. */
    nextBot() {
      while (idx < turns.length && turns[idx].speaker !== 'user') {
        const t = turns[idx]; idx++
        return { text: t.text?.[lang] || t.text?.en || t[lang], tr: t.text?.tr || t.tr, done: idx >= turns.length }
      }
      return null
    },
    /** Kullanıcı turu bekliyor mu? */
    expectsUser: () => turns[idx]?.speaker === 'user',
    /** Kullanıcının beklenen repliği (hedef metin + alternatifler). */
    userTarget() {
      const t = turns[idx]
      if (!t || t.speaker !== 'user') return null
      const text = t.text?.[lang] || t.answer?.[lang] || t.text?.en
      const alts = t.alts?.[lang] || t.text?.alts?.[lang] || []
      return { text, alts, tr: t.text?.tr }
    },
    /** Kullanıcı cevabını değerlendir; doğruysa indeksi ilerlet. */
    submit(input, { spoken = false } = {}) {
      const tgt = this.userTarget()
      if (!tgt) return { ok: true, advanced: false }
      const candidates = [tgt.text, ...(tgt.alts || [])].filter(Boolean)
      let best = 0
      for (const c of candidates) {
        const s = spoken ? getPronunciationScore(input, c).score
                         : Math.round((checkAnswer(input, c).score || 0) * 100)
        if (s > best) best = s
      }
      const ok = best >= (spoken ? 55 : 60)
      if (ok) idx++
      return { ok, score: best, feedback: ok ? random(PRAISE) : random(RETRY), expected: tgt.text }
    },
  }
}

/**
 * Serbest mod: kelime kartlarından sohbet soruları üretir.
 * Bot TR ipucu verir, kullanıcı hedef dilde söyler/yazar.
 */
export function createTopicSession(cards, lang = 'en') {
  const pool = [...cards]
  let i = 0
  return {
    lang,
    isDone: () => i >= pool.length,
    ask() {
      const c = pool[i]
      if (!c) return null
      return { source: c.source, answer: c.target, emoji: c.emoji, prompt: `"${c.source}" nasıl denir?` }
    },
    submit(input, { spoken = false } = {}) {
      const c = pool[i]
      if (!c) return { ok: true }
      const s = spoken ? getPronunciationScore(input, c.target).score
                       : Math.round((checkAnswer(input, c.target).score || 0) * 100)
      const ok = s >= (spoken ? 55 : 60)
      if (ok) i++
      return { ok, score: s, feedback: ok ? random(PRAISE) : random(RETRY), expected: c.target }
    },
    skip() { i++ },
  }
}
