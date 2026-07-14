/**
 * core/contentStore.js — TEK birleşik içerik yükleyici (Faz A/B)
 *
 * Bu, kelime verisinin TEK kaynağıdır. Eski dağınık yollar
 * (useWordStore, oxfordProcessor, categories.js, doğrudan import)
 * bunun yerine geçer.
 *
 * Veri: src/content/words/{A1..C2}.json  (düz 5-dilli şema)
 * Şema: { id, level, category, tr, en, es, pt, de, pos, emoji, ipa, examples }
 *
 * Yükleme seviye bazında lazy — C2 dolsa bile başlangıç hızlı kalır.
 */
import { useState, useEffect } from 'react'
import { LEVEL_ORDER } from './levels'
import { SOURCE_LANG } from './languages'

// Vite: tüm seviye dosyalarını lazy modül olarak topla
const levelModules = import.meta.glob('../content/words/*.json')

const _cache = new Map()   // level → Word[]

function fileKey(level) {
  return `../content/words/${level}.json`
}

/** Tek seviyeyi yükle (cache'li). Dosya yoksa boş dizi. */
export async function loadLevel(level) {
  if (_cache.has(level)) return _cache.get(level)
  const loader = levelModules[fileKey(level)]
  if (!loader) { _cache.set(level, []); return [] }
  const mod = await loader()
  const words = (mod.default ?? mod) || []
  _cache.set(level, words)
  return words
}

/** Birden çok seviyeyi (varsayılan: A1'e kadar dahil) yükle. */
export async function loadUpToLevel(maxLevel = 'A1') {
  const maxIdx = LEVEL_ORDER.indexOf(maxLevel)
  const levels = LEVEL_ORDER.slice(0, maxIdx < 0 ? 1 : maxIdx + 1)
  const chunks = await Promise.all(levels.map(loadLevel))
  return chunks.flat()
}

/** Mevcut (dosyası olan) seviyeleri döndür. */
export function availableLevels() {
  return LEVEL_ORDER.filter(l => levelModules[fileKey(l)])
}

/**
 * Bir kelime girdisini, aktif hedef dile göre "kart" görünümüne çevirir.
 * @returns { id, level, category, source, target, emoji, ipa, pos, examples }
 */
export function toCard(entry, lang = 'en') {
  return {
    id: entry.id,
    level: entry.level,
    category: entry.category,
    source: entry[SOURCE_LANG],          // Türkçe (soru yönü)
    target: entry[lang] ?? entry.en,     // hedef dil (cevap yönü)
    emoji: entry.emoji || null,
    ipa: entry.ipa?.[lang] || null,
    pos: entry.pos || null,
    examples: (entry.examples || [])
      .map(ex => ({ source: ex[SOURCE_LANG], target: ex[lang] }))
      .filter(ex => ex.target),
    raw: entry,
  }
}

/** Kategori listesini (sayımlarıyla) döndür. */
export function categoriesOf(words) {
  const map = {}
  for (const w of words) map[w.category] = (map[w.category] || 0) + 1
  return Object.entries(map)
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)
}

// ─── React hook ───────────────────────────────────────────
/**
 * useWords — belirtilen seviyeye kadar kelimeleri yükler.
 * @param {{ maxLevel?: string, category?: string, lang?: string }} opts
 */
export function useWords({ maxLevel = 'A1', category = null, lang = 'en' } = {}) {
  const [words, setWords]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    loadUpToLevel(maxLevel).then(all => {
      if (!alive) return
      const filtered = category && category !== 'all'
        ? all.filter(w => w.category === category)
        : all
      setWords(filtered)
      setLoading(false)
    })
    return () => { alive = false }
  }, [maxLevel, category])

  const cards = words.map(w => toCard(w, lang))
  return { words, cards, loading, categories: categoriesOf(words) }
}
