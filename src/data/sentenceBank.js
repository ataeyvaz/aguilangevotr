/**
 * sentenceBank.js — Diyalog + senaryo cümlelerini toplayan paylaşılan kaynak.
 * SentenceBuilder ve Shadowing (Söyle) modları bunu kullanır.
 */
const dialogueMods = import.meta.glob('./dialogues/*.json')
const scenarioMods = import.meta.glob('./scenarios/*.json')

const words = (s) => (s || '').trim().split(/\s+/).filter(Boolean)

/**
 * @param {string} lang  hedef dil ('en'|'es'|'pt'|'de')
 * @param {{minW?:number,maxW?:number}} opts  kelime sayısı sınırı
 * @returns {Promise<{tr,target}[]>}
 */
export async function collectSentences(lang, { minW = 2, maxW = 10 } = {}) {
  const out = []
  const push = (tr, target) => {
    if (!tr || !target) return
    const n = words(target).length
    if (n < minW || n > maxW) return
    out.push({ tr, target })
  }

  const dlgs = await Promise.all(Object.values(dialogueMods).map(fn => fn()))
  for (const m of dlgs) {
    for (const line of (m.default?.lines || [])) push(line.tr, line[lang])
  }
  const scns = await Promise.all(Object.values(scenarioMods).map(fn => fn()))
  for (const m of scns) {
    const s = m.default
    for (const ex of (s?.teach || [])) push(ex.tr, ex[lang])
    for (const qa of (s?.qa || [])) {
      push(qa.prompt?.tr, qa.prompt?.[lang])
      push(qa.answer?.tr, qa.answer?.[lang])
    }
  }

  const seen = new Set()
  return out.filter(s => {
    const k = s.target.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k); return true
  })
}
