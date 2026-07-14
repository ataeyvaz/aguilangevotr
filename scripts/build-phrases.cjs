/**
 * build-phrases.cjs — A2/B1/B2 içeriğini aguilang1 ifade dosyalarından üretir.
 * Kaynak (her seviye): en-tr-{lv}.json (en+tr), en-es-{lv}.json, en-de-{lv}.json
 * `en` üzerinden birleştirir → src/content/words/{LV}.json (düz şema)
 */
const fs = require('fs')
const path = require('path')
const dir = path.join(__dirname, '..', 'src', 'data', 'aguilang1')
const outDir = path.join(__dirname, '..', 'src', 'content', 'words')
const load = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8').replace(/^﻿/, ''))

const LEVELS = ['a2', 'b1', 'b2']
const norm = (s) => (s || '').trim().toLowerCase()
const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40)

for (const lv of LEVELS) {
  const tr = load(`en-tr-${lv}.json`)
  const es = load(`en-es-${lv}.json`)
  const de = load(`en-de-${lv}.json`)
  const esMap = Object.fromEntries(es.map(x => [norm(x.en), x.es]))
  const deMap = Object.fromEntries(de.map(x => [norm(x.en), x.de]))

  const seen = new Set()
  const out = []
  for (const x of tr) {
    if (!x.en || !x.tr) continue
    const key = norm(x.en)
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      id: `${lv}_phrases_${slug(x.tr) || slug(x.en)}`,
      level: lv.toUpperCase(), category: 'phrases',
      tr: x.tr, en: x.en, es: esMap[key] || null, pt: null, de: deMap[key] || null,
      pos: null, emoji: null, ipa: {}, examples: [],
    })
  }
  fs.writeFileSync(path.join(outDir, `${lv.toUpperCase()}.json`), JSON.stringify(out, null, 2), 'utf8')
  console.log(`✅ ${lv.toUpperCase()}.json → ${out.length} ifade (es: ${out.filter(w => w.es).length}, de: ${out.filter(w => w.de).length})`)
}
