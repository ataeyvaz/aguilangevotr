/**
 * build-content.cjs — Birleşik içerik derleyici (Faz A)
 *
 * Girdi:  src/data/*-a1.json  (iki format: düz dizi + eski nested)
 * Çıktı:  src/content/words/A1.json  (tek düz şema, 5 dilli)
 *
 * Düz şema (unified WordEntry):
 * {
 *   id, level, category,
 *   tr, en, es, pt, de,
 *   pos, emoji,
 *   ipa: { en, es, pt, de },
 *   examples: [ { tr, en, es, pt, de } ]
 * }
 *
 * Kullanım: node scripts/build-content.cjs
 */
const fs   = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '..', 'src', 'data')
const OUT_DIR  = path.join(__dirname, '..', 'src', 'content', 'words')
const LANGS    = ['en', 'es', 'pt', 'de']

// ── Türkçe slug (id üretimi için) ──────────────────────────
function slug(s) {
  return (s || '')
    .toString().trim().toLowerCase()
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c')
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

// ── Düz format girdisini normalize et ──────────────────────
function fromFlat(raw, category, level) {
  return {
    level,
    category: raw.category || category,
    tr: raw.tr, en: raw.en, es: raw.es, pt: raw.pt, de: raw.de,
    pos: raw.pos || null,
    emoji: raw.emoji || null,
    ipa: raw.ipa || {},
    examples: raw.examples || [],
  }
}

// ── Nested format dosyasını düz girdilere çevir ────────────
function fromNested(data, category, level) {
  const translations = data.translations || {}
  const byId = {}   // id → unified entry

  for (const [lang, block] of Object.entries(translations)) {
    if (!LANGS.includes(lang) && lang !== 'en') continue
    for (const w of (block.words || [])) {
      const key = w.id || slug(w.tr) || slug(w.word)
      if (!byId[key]) {
        byId[key] = {
          level,
          category: data.category || category,
          tr: w.tr || null,
          emoji: w.emoji || null,
          pos: w.pos || null,
          ipa: {},
          _sent: {},   // geçici: dil → ilk cümle
        }
      }
      const e = byId[key]
      e[lang] = w.word            // en/es/pt/de kelimesi
      if (w.pron) e.ipa[lang] = w.pron
      if (!e.tr && w.tr) e.tr = w.tr
      if (!e.emoji && w.emoji) e.emoji = w.emoji
      const first = (w.sentences || [])[0]
      if (first) e._sent[lang] = { text: first.text || first[lang] || first.en, tr: first.tr }
    }
  }

  // _sent → examples (tek örnek, tüm diller birleştirilmiş)
  return Object.values(byId).map(e => {
    const ex = {}
    let exTr = null
    for (const lang of ['en', 'es', 'pt', 'de']) {
      if (e._sent[lang]) { ex[lang] = e._sent[lang].text; exTr = exTr || e._sent[lang].tr }
    }
    if (exTr) ex.tr = exTr
    delete e._sent
    e.examples = Object.keys(ex).length ? [ex] : []
    return e
  })
}

// ── Ana derleme ────────────────────────────────────────────
function build() {
  // verbs-a1.json (TR'siz eski) yerine verbs-tr-a1.json kullanılır
  const IGNORE = new Set(['verbs-a1.json'])
  const files = fs.readdirSync(DATA_DIR).filter(f => /-a1\.json$/.test(f) && !IGNORE.has(f))
  const level = 'A1'
  const all = []

  for (const file of files) {
    const category = file.replace(/-a1\.json$/, '').replace(/^words-tr$/, 'mixed')
    let raw
    try { raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8')) }
    catch (e) { console.warn('⚠️  okunamadı:', file, e.message); continue }

    let entries = []
    if (Array.isArray(raw)) {
      // düz dizi (words-tr-a1.json)
      entries = raw.map(w => fromFlat(w, category, level))
    } else if (raw.translations) {
      // eski nested
      entries = fromNested(raw, category, level)
    } else if (Array.isArray(raw.words)) {
      // 3. format: { category, level, words: [{en,es,pt,de?,tr?,pron}] }
      const cat = raw.category || category
      entries = raw.words.map(w => ({
        level,
        category: cat,
        tr: w.tr || null, en: w.en, es: w.es, pt: w.pt, de: w.de || null,
        pos: w.pos || (cat === 'verbs' ? 'verb' : null),
        emoji: w.emoji || null,
        ipa: w.pron ? { en: w.pron } : {},
        examples: w.examples || [],
      }))
    } else {
      console.warn('⚠️  bilinmeyen format:', file); continue
    }
    entries.forEach(e => all.push(e))
    console.log(`  ${file.padEnd(20)} → ${entries.length} girdi`)
  }

  // ── TR eksik girdileri boşluk raporuna ayır ──
  const gaps = all.filter(e => e.en && !e.tr)

  // ── Dedupe: (category + tr) benzersiz. Düz format (daha çok dil) öncelikli ──
  const seen = new Map()   // "category|tr" → entry
  for (const e of all) {
    if (!e.tr || !e.en) continue   // en+tr zorunlu
    const key = `${e.category}|${slug(e.tr)}`
    const langCount = LANGS.filter(l => e[l]).length
    const prev = seen.get(key)
    if (!prev || langCount > LANGS.filter(l => prev[l]).length) {
      seen.set(key, e)
    }
  }

  // ── Nihai id ata ──
  const final = [...seen.values()].map((e, i) => ({
    id: `a1_${e.category}_${slug(e.tr)}`,
    ...e,
  }))

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const outPath = path.join(OUT_DIR, `${level}.json`)
  fs.writeFileSync(outPath, JSON.stringify(final, null, 2), 'utf8')

  // ── Özet ──
  const cats = {}
  final.forEach(w => cats[w.category] = (cats[w.category] || 0) + 1)
  console.log('\n✅ Birleşik içerik yazıldı:', path.relative(process.cwd(), outPath))
  console.log(`   Toplam benzersiz kelime: ${final.length}`)
  console.log('   Kategoriler:', cats)

  // ── Boşluk raporu (TR eksik) ──
  if (gaps.length) {
    const gapPath = path.join(OUT_DIR, '_gaps.json')
    const gapOut = gaps.map(g => ({ category: g.category, en: g.en, es: g.es, pt: g.pt, tr: '', de: '' }))
    fs.writeFileSync(gapPath, JSON.stringify(gapOut, null, 2), 'utf8')
    console.log(`\n⚠️  ${gaps.length} kelimede TR eksik → ${path.relative(process.cwd(), gapPath)}`)
    console.log('   (İçerik boşluğu — doldurulunca ana dosyaya karışır)')
  }
}

build()
