/**
 * placementEngine.js — Seviye testi sorularını SEÇİLİ hedef dile göre
 * içerikten (contentStore) dinamik üretir.
 *
 * Eski sorun: sorular sabit ve karışıktı (EN+ES+PT) → TR→EN seçen kişiye
 * İspanyolca/Portekizce soruluyordu. Artık yalnız seçili dilde sorulur.
 *
 * Ayrıca A1→B2 kapsar → uygulama içi ilerleme seviyesi tespitinde de kullanılır.
 */
import { loadUpToLevel } from './contentStore'
import { TARGET_LANGS } from './languages'

function shuffle(a) {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

const PLAN = [['A1', 5], ['A2', 4], ['B1', 2], ['B2', 1]]   // ~12 soru, seviyeye yayılmış

/**
 * @param {string} lang  hedef dil ('en'|'es'|'pt'|'de')
 * @returns {Promise<Array>} { id, cefr_level, skill_area, question, options, correctIndex }
 */
export async function generatePlacement(lang) {
  const all = await loadUpToLevel('B2')
  const byLevel = {}
  for (const w of all) {
    if (!w[lang] || !w.tr) continue
    ;(byLevel[w.level] ||= []).push(w)
  }
  const label = TARGET_LANGS[lang]?.label || 'İngilizce'

  const qs = []
  let id = 1
  for (const [lv, n] of PLAN) {
    const pool = byLevel[lv] || []
    if (pool.length < 4) continue
    for (const w of shuffle(pool).slice(0, n)) {
      const distractors = shuffle(pool.filter(x => x[lang] !== w[lang])).slice(0, 3).map(x => x[lang])
      if (distractors.length < 3) continue
      const options = shuffle([w[lang], ...distractors])
      qs.push({
        id: id++,
        cefr_level: lv,
        skill_area: lv,
        question: `“${w.tr}” — ${label} nasıl denir?`,
        options,
        correctIndex: options.indexOf(w[lang]),
      })
    }
  }
  return qs
}

const ORDER = ['A1', 'A2', 'B1', 'B2']

/**
 * Cevaplardan seviye hesapla: her seviyede %60+ doğru → o seviyeye çık.
 * @param {Array} answers  [{ cefr_level, correct }]
 */
export function computeLevelFromAnswers(answers) {
  let level = 'A1'
  for (const lv of ORDER) {
    const inLv = answers.filter(a => a.cefr_level === lv)
    if (!inLv.length) continue
    const ratio = inLv.filter(a => a.correct).length / inLv.length
    if (ratio >= 0.6) level = lv
    else break
  }
  return level
}
