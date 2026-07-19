/**
 * core/sentenceStore.js — TEK birleşik cümle & kalıp kaydı
 *
 * Cümle pratiği (SentenceMini, SentenceBuilder, FillBlank, PatternDrill) buraya kaydeder.
 * Amaç: kullanıcının hangi cümle KALIPLARINI (soru, isteme, olumsuz...) öğrendiğini /
 * hangilerinde zorlandığını raporlayabilmek — hem kalıp-türü özeti hem tek tek cümle.
 *
 * TEK anahtar: aguilang_sentences (progressStore deseninin cümle karşılığı).
 *
 * Depo şekli:
 * {
 *   version: 1,
 *   patterns:  { [fn]: { correct, wrong, lastSeen } },        // işlev türü özeti
 *   sentences: { [lang|target]: { tr, target, fn, lang, correct, wrong, lastSeen } }
 * }
 */
const KEY = 'aguilang_sentences'
const VERSION = 1

// wordSentence.js içindeki fn değerleri + genel bucket'lar → TR etiket
export const FN_LABELS = {
  // temel
  soru: 'Soru',
  isteme: 'İsteme',
  olumsuz: 'Olumsuz',
  sevme: 'Sevme / Beğenme',
  tanımlama: 'Tanımlama',
  sahiplik: 'Sahiplik',
  rica: 'Rica',
  verme: 'Verme',
  zaman: 'Zaman',
  derece: 'Derece',
  'sıfat+isim': 'Sıfat + İsim',
  // fiil / durum kalıpları
  ihtiyaç: 'İhtiyaç',
  görme: 'Görme',
  arama: 'Arama',
  zorunluluk: 'Zorunluluk',
  öğrenme: 'Öğrenme',
  planlama: 'Planlama',
  deneme: 'Deneme',
  duygu: 'Duygu',
  ünlem: 'Ünlem',
  karşılaştırma: 'Karşılaştırma',
  // kategoriye özel bağlamsal kalıplar
  stok: 'Var mı? (stok)',
  fiyat: 'Fiyat Sorma',
  lezzet: 'Lezzet / Beğeni',
  giyme: 'Giyme',
  yönelme: 'Gitme / Yön',
  konum: 'Konum / Yer',
  aile: 'Aile',
  ağrı: 'Ağrı / Şikayet',
  meslek: 'Meslek',
  oynama: 'Oynama',
  sayma: 'Sayma',
  yaş: 'Yaş',
  // genel bucket'lar
  cümle: 'Genel Cümle',
  kalıp: 'Cümle Kalıbı',
}

export const fnLabel = (fn) => FN_LABELS[fn] || fn || 'Genel Cümle'

let _store = null

function blank() {
  return { version: VERSION, patterns: {}, sentences: {} }
}

export function load() {
  if (_store) return _store
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (raw && raw.version === VERSION) { _store = raw; return _store }
  } catch { /* yoksay */ }
  _store = blank()
  save()
  return _store
}

function save() {
  if (_store) localStorage.setItem(KEY, JSON.stringify(_store))
}

/**
 * Bir cümle pratiği sonucunu kaydeder (kalıp özeti + tek tek cümle).
 * @param {{tr?:string, target:string, fn?:string, lang:string}} s
 * @param {boolean} isCorrect
 */
export function recordSentence(s, isCorrect) {
  if (!s || !s.target) return
  const store = load()
  const fn   = s.fn || 'cümle'
  const lang = s.lang || 'en'
  const now  = new Date().toISOString()

  // Kalıp-türü özeti
  const p = store.patterns[fn] || { correct: 0, wrong: 0, lastSeen: null }
  p.correct += isCorrect ? 1 : 0
  p.wrong   += isCorrect ? 0 : 1
  p.lastSeen = now
  store.patterns[fn] = p

  // Tek tek cümle
  const key = `${lang}|${s.target}`
  const c = store.sentences[key] || { tr: s.tr || '', target: s.target, fn, lang, correct: 0, wrong: 0, lastSeen: null }
  c.correct += isCorrect ? 1 : 0
  c.wrong   += isCorrect ? 0 : 1
  c.lastSeen = now
  if (s.tr && !c.tr) c.tr = s.tr
  store.sentences[key] = c

  save()
  try { window.dispatchEvent(new Event('sentenceStatsUpdated')) } catch { /* yoksay */ }
}

/**
 * Rapor verisi.
 * @param {string} [lang] verilirse yalnızca o hedef dile filtreler
 * @returns {{patterns:Array, learned:Array, struggling:Array, totalSentences:number}}
 */
export function getSentenceReport(lang) {
  const store = load()

  const patterns = Object.entries(store.patterns)
    .map(([fn, s]) => {
      const total = s.correct + s.wrong
      return { fn, label: fnLabel(fn), correct: s.correct, wrong: s.wrong, total,
               rate: total > 0 ? Math.round((s.correct / total) * 100) : 0 }
    })
    .filter(p => p.total > 0)
    .sort((a, b) => b.total - a.total)

  const all = Object.values(store.sentences)
    .filter(c => !lang || c.lang === lang)

  const learned = all
    .filter(c => c.correct > 0 && c.correct >= c.wrong)
    .sort((a, b) => (b.lastSeen || '').localeCompare(a.lastSeen || ''))

  const struggling = all
    .filter(c => c.wrong > 0 && c.wrong > c.correct)
    .sort((a, b) => (b.wrong - b.correct) - (a.wrong - a.correct))

  return { patterns, learned, struggling, totalSentences: all.length }
}

export function resetSentences() {
  _store = blank()
  save()
  try { window.dispatchEvent(new Event('sentenceStatsUpdated')) } catch { /* yoksay */ }
}
