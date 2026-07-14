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

// TR anahtar kelimelere göre topik kategori (eşleşmezse soru/genel)
const BUCKETS = [
  ['food',     ['ye', 'yemek', 'iç', 'aç', 'susa', 'kahvalt', 'ekmek', 'süt', 'meyve', 'sebze', 'pişir', 'lezzet', 'tatl']],
  ['family',   ['anne', 'baba', 'kardeş', 'aile', 'çocuk', 'dede', 'nine', 'abla', 'ağabey', 'eş']],
  ['feelings', ['mutlu', 'üzgün', 'kötü', 'korku', 'kız', 'sevin', 'yorgun', 'sıkıl', 'heyecan', 'ağla', 'gül', 'sev']],
  ['travel',   ['yol', 'tren', 'uçak', 'otobüs', 'araba', 'seyahat', 'bilet', 'gez', 'tatil', 'harita']],
  ['time',     ['bugün', 'yarın', 'dün', 'şimdi', 'saat', 'hafta', 'sabah', 'akşam', 'gece', 'geç', 'erken', 'dakika', 'yıl']],
  ['home',     ['oda', 'kapı', 'pencere', 'mutfak', 'banyo', 'yatak', 'salon', 'temizl']],
  ['jobs',     ['çalış', 'para', 'ofis', 'patron', 'toplant', 'işçi', 'maaş', 'ödeme']],
  ['health',   ['hasta', 'doktor', 'ağr', 'ilaç', 'hastane', 'iyileş', 'sağlık']],
  ['school',   ['okul', 'öğren', 'öğret', 'ders', 'sınıf', 'kitap', 'ödev', 'kalem']],
]

function categorize(tr, en) {
  const t = norm(tr)
  for (const [cat, kws] of BUCKETS) {
    if (kws.some(k => t.includes(k))) return cat
  }
  if ((en || '').trim().endsWith('?')) return 'questions'
  return 'phrases'
}

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
    const cat = categorize(x.tr, x.en)
    out.push({
      id: `${lv}_${cat}_${slug(x.tr) || slug(x.en)}`,
      level: lv.toUpperCase(), category: cat,
      tr: x.tr, en: x.en, es: esMap[key] || null, pt: null, de: deMap[key] || null,
      pos: null, emoji: null, ipa: {}, examples: [],
    })
  }
  fs.writeFileSync(path.join(outDir, `${lv.toUpperCase()}.json`), JSON.stringify(out, null, 2), 'utf8')
  const cats = {}; out.forEach(w => cats[w.category] = (cats[w.category] || 0) + 1)
  console.log(`✅ ${lv.toUpperCase()}.json → ${out.length} ifade | kategoriler:`, cats)
}
