/**
 * core/progressStore.js — TEK birleşik ilerleme deposu (Faz B)
 *
 * Eskiden ilerleme 3+ yerde paralel tutuluyordu (birbirinden habersiz):
 *   useWordStore → aguilangevo_progress
 *   studyService → aguilang_srs_progress / aguilang_srs_stats
 *   sayfalar     → aguilang_word_stats / aguilang_daily_stats / aguilang_progress_v2
 *
 * Bu modül hepsinin yerine geçer. TEK anahtar: aguilang_progress
 * İlk açılışta eski anahtarlardan veri GÖÇ ETTİRİLİR (kaybolmaz).
 *
 * Depo şekli:
 * {
 *   version: 3,
 *   words: { [wordId]: SM2State },   // per-kelime SM-2
 *   meta:  { xp, streakDays, lastActiveDate, daily: { 'YYYY-MM-DD': count } }
 * }
 */
const KEY = 'aguilang_progress'
const VERSION = 3

const today = () => new Date().toISOString().split('T')[0]
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0] }

// ─── Yükleme + göç ─────────────────────────────────────────
let _store = null

function blank() {
  return { version: VERSION, words: {}, meta: { xp: 0, streakDays: 0, lastActiveDate: null, daily: {} } }
}

function migrateLegacy(store) {
  // studyService formatı: { [wordId]: {repetitions, ease_factor, interval_days, next_review_date, status, correct_count, wrong_count} }
  try {
    const srs = JSON.parse(localStorage.getItem('aguilang_srs_progress') || '{}')
    for (const [id, s] of Object.entries(srs)) {
      if (!store.words[id]) store.words[id] = normalizeSM2(s)
    }
  } catch { /* yoksay */ }

  // useWordStore formatı: { words: { [id]: {seen, correct, incorrect, streak, mastered, nextReview} }, stats:{totalXP} }
  try {
    const legacy = JSON.parse(localStorage.getItem('aguilangevo_progress') || 'null')
    if (legacy?.words) {
      for (const [id, w] of Object.entries(legacy.words)) {
        if (store.words[id]) continue
        store.words[id] = {
          repetitions: w.mastered ? 4 : (w.streak || 0),
          ease_factor: 2.5,
          interval_days: w.mastered ? 15 : 1,
          next_review_date: w.nextReview ? new Date(w.nextReview).toISOString().split('T')[0] : today(),
          status: w.mastered ? 'mastered' : (w.seen > 0 ? 'learning' : 'new'),
          correct_count: w.correct || 0,
          wrong_count: w.incorrect || 0,
        }
      }
    }
    if (legacy?.stats?.totalXP) store.meta.xp = Math.max(store.meta.xp, legacy.stats.totalXP)
  } catch { /* yoksay */ }

  // Basit doğru/yanlış sayaçları: aguilang_word_stats { [id]: {correct, wrong} }
  try {
    const ws = JSON.parse(localStorage.getItem('aguilang_word_stats') || '{}')
    for (const [id, s] of Object.entries(ws)) {
      if (store.words[id]) continue
      store.words[id] = {
        repetitions: 0, ease_factor: 2.5, interval_days: 1,
        next_review_date: today(), status: 'learning',
        correct_count: s.correct || 0, wrong_count: s.wrong || 0,
      }
    }
  } catch { /* yoksay */ }

  return store
}

function normalizeSM2(s = {}) {
  return {
    repetitions: s.repetitions ?? 0,
    ease_factor: s.ease_factor ?? 2.5,
    interval_days: s.interval_days ?? 0,
    next_review_date: s.next_review_date ?? today(),
    status: s.status ?? 'new',
    correct_count: s.correct_count ?? 0,
    wrong_count: s.wrong_count ?? 0,
  }
}

export function load() {
  if (_store) return _store
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (raw && raw.version === VERSION) { _store = raw; return _store }
  } catch { /* yoksay */ }
  // yeni depo — eskilerden göç et
  _store = migrateLegacy(blank())
  save()
  return _store
}

function save() {
  if (_store) localStorage.setItem(KEY, JSON.stringify(_store))
}

// ─── SM-2 çekirdeği ────────────────────────────────────────
function computeSM2(cur, quality) {
  const reps = cur.repetitions ?? 0
  const ef0  = cur.ease_factor ?? 2.5
  const int0 = cur.interval_days ?? 0
  const ef = Math.max(1.3, ef0 + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  let reps2, int2
  if (quality < 3) { reps2 = 0; int2 = 1 }
  else {
    reps2 = reps + 1
    int2 = reps2 === 1 ? 1 : reps2 === 2 ? 6 : Math.max(1, Math.round(int0 * ef))
  }
  const status = reps2 <= 2 ? 'learning' : reps2 <= 5 ? 'review' : 'mastered'
  return {
    repetitions: reps2,
    ease_factor: Math.round(ef * 1000) / 1000,
    interval_days: int2,
    next_review_date: addDays(int2),
    status,
  }
}

// ─── Genel API ─────────────────────────────────────────────
export function getState(wordId) {
  return load().words[wordId] || null
}

/**
 * Cevabı kaydeder, SM-2 çalıştırır, XP + günlük sayaç + streak günceller.
 * @param {string} wordId
 * @param {boolean} isCorrect
 * @param {number} [quality] 0..5 (verilmezse doğru→4, yanlış→0)
 */
export function recordAnswer(wordId, isCorrect, quality) {
  const store = load()
  const cur = store.words[wordId] ?? {}
  const q = quality !== undefined ? quality : (isCorrect ? 4 : 0)
  const srs = computeSM2(cur, q)
  store.words[wordId] = {
    ...srs,
    correct_count: (cur.correct_count ?? 0) + (isCorrect ? 1 : 0),
    wrong_count:   (cur.wrong_count ?? 0) + (isCorrect ? 0 : 1),
    last_reviewed_at: new Date().toISOString(),
  }
  // XP + günlük
  store.meta.xp += isCorrect ? (srs.status === 'mastered' ? 15 : 10) : 2
  bumpDaily(store)
  bumpLegacyDaily(isCorrect)   // Dashboard'ın günlük hedef + 7 gün grafiği için köprü
  save()
  return srs
}

// aguilang_daily_stats (useDailyStats) ile senkron tut — eski widget'lar çalışsın
function bumpLegacyDaily(isCorrect) {
  try {
    const KEY = 'aguilang_daily_stats'
    const all = JSON.parse(localStorage.getItem(KEY) || '{}')
    const t = today()
    const d = all[t] || { seen: 0, correct: 0, wrong: 0, minutes: 0 }
    all[t] = { ...d, seen: d.seen + 1, correct: d.correct + (isCorrect ? 1 : 0), wrong: d.wrong + (isCorrect ? 0 : 1) }
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch { /* yoksay */ }
}

function bumpDaily(store) {
  const t = today()
  store.meta.daily[t] = (store.meta.daily[t] || 0) + 1
  // streak
  if (store.meta.lastActiveDate !== t) {
    const y = addDays(-1)
    store.meta.streakDays = store.meta.lastActiveDate === y ? (store.meta.streakDays || 0) + 1 : 1
    store.meta.lastActiveDate = t
  }
}

/** Çalışılacak sonraki kelimeler: önce vadesi gelenler, sonra yeni. */
export function getDue(words, limit = 10) {
  const store = load()
  const now = today()
  const due   = words.filter(w => { const p = store.words[w.id]; return p && p.status !== 'mastered' && p.next_review_date <= now })
  const fresh = words.filter(w => !store.words[w.id])
  let pool = [...due, ...fresh]
  if (pool.length === 0) pool = words.filter(w => store.words[w.id]?.status !== 'mastered')
  return pool.slice(0, limit)
}

/** Toplam istatistikler (Dashboard için). */
export function getStats(words = []) {
  const store = load()
  const counts = { new: 0, learning: 0, review: 0, mastered: 0 }
  let todayDue = 0
  const now = today()
  for (const w of words) {
    const p = store.words[w.id]
    if (!p) { counts.new++; continue }
    counts[p.status] = (counts[p.status] ?? 0) + 1
    if (p.status !== 'mastered' && p.next_review_date <= now) todayDue++
  }
  return {
    ...counts,
    todayDue,
    totalWords: words.length,
    xp: store.meta.xp,
    streakDays: store.meta.streakDays,
    todayCount: store.meta.daily[now] || 0,
    level: undefined,   // Dashboard levelFromXP ile hesaplar
  }
}

/** Zor kelimeler (çok yanlış). */
export function getHardWords(limit = 5) {
  const store = load()
  return Object.entries(store.words)
    .filter(([, s]) => s.wrong_count >= 2 && s.correct_count <= s.wrong_count)
    .map(([id, s]) => ({ id, ...s }))
    .sort((a, b) => b.wrong_count - a.wrong_count)
    .slice(0, limit)
}

export function resetProgress() {
  _store = blank()
  save()
}
