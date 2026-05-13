/**
 * conversationService.js — Browser-uyumlu conversation pack servisi
 *
 * SQLite yerine JSON dosyalarından okur; ilerleme localStorage'da saklanır.
 * Native/Capacitor build'da bu servis src/db/conversationQueries.js ile swap edilir.
 */

import packs1    from '../../conversation_pack_test.json'
import packs2    from '../../conversation_pack_batch2.json'
import packs3    from '../../conversation_pack_batch3.json'
import packs4    from '../../conversation_pack_batch4.json'
import packs5    from '../../conversation_pack_batch5.json'
import packsMissing from '../../conversation_pack_missing.json'
import packsScenarios from '../../conversation_pack_scenarios_es.json'

const PROGRESS_KEY = 'aguilang_conv_progress'

// Tüm packler tek dizide — word+difficulty üzerinden filtrelenecek
const ALL_PACKS = [
  ...packs1,
  ...packs2,
  ...packs3,
  ...packs4,
  ...(Array.isArray(packs5) ? packs5 : []),
  ...packsMissing,
  ...(Array.isArray(packsScenarios) ? packsScenarios : []),
]

// ── Debug ─────────────────────────────────────────────────────
if (import.meta.env.DEV) {
  console.info('[conversationService] ALL_PACKS yüklendi:', ALL_PACKS.length, 'pack')
  console.info('[conversationService] Unique kelimeler:', new Set(ALL_PACKS.map(p => p.word)).size)
}

// ── Pack sorgulama ────────────────────────────────────────────

/**
 * Verilen kelime + zorluk seviyesi için ilk packı döner.
 * @param {string} word
 * @param {'easy'|'medium'|'hard'} difficulty
 * @returns {object|null}
 */
export function getPackForWord(word, difficulty = 'easy') {
  const wordLower = word.trim().toLowerCase()
  const pack = ALL_PACKS.find(
    p => p.word.trim().toLowerCase() === wordLower && p.difficulty === difficulty
  ) ?? null
  if (import.meta.env.DEV && !pack) {
    console.warn(`[conversationService] Pack bulunamadı: word="${word}" difficulty="${difficulty}"`)
  }
  return pack
}

/**
 * Bir kelime için pack mevcut mu?
 * Study.jsx gibi bileşenler Practice butonunu buna göre gösterir.
 * @param {string} word
 * @returns {boolean}
 */
export function hasPackForWord(word) {
  const wordLower = word.trim().toLowerCase()
  return ALL_PACKS.some(p => p.word.trim().toLowerCase() === wordLower)
}

/**
 * Pack'i olan tüm kelimelerin listesi.
 * @returns {string[]}
 */
export function getAllPackWords() {
  return [...new Set(ALL_PACKS.map(p => p.word))].sort()
}

/**
 * Bir kelime için hangi difficulty seviyeleri mevcut.
 * @param {string} word
 * @returns {string[]}
 */
export function getAvailableDifficulties(word) {
  const wordLower = word.trim().toLowerCase()
  const found = new Set(
    ALL_PACKS
      .filter(p => p.word.trim().toLowerCase() === wordLower)
      .map(p => p.difficulty)
  )
  return ['easy', 'medium', 'hard'].filter(d => found.has(d))
}

/**
 * Pack nesnesinden exchange dizisini döner (JSON artık parse edilmiş halde gelir).
 * @param {object} pack
 * @returns {object[]}
 */
export function getExchanges(pack) {
  return pack?.exchanges ?? []
}

// ── Progress (localStorage) ───────────────────────────────────

function loadProgress() {
  try {
    const s = localStorage.getItem(PROGRESS_KEY)
    return s ? JSON.parse(s) : {}
  } catch { return {} }
}

/**
 * Practice sonucunu kaydeder.
 * @param {string} word
 * @param {string} difficulty
 * @param {number} score       — kazanılan toplam puan
 * @param {number} correct     — doğru sayısı
 * @param {number} total       — toplam exchange sayısı
 */
export function saveConvProgress(word, difficulty, score, correct, total) {
  const prog = loadProgress()
  const key  = `${word}__${difficulty}`
  const prev = prog[key] ?? { bestScore: 0, attempts: 0 }
  prog[key]  = {
    bestScore:    Math.max(prev.bestScore, score),
    attempts:     prev.attempts + 1,
    lastCorrect:  correct,
    lastTotal:    total,
    lastPlayedAt: new Date().toISOString(),
  }
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(prog))
}

/**
 * Bir kelime + difficulty için kayıtlı ilerlemeyi döner.
 * @param {string} word
 * @param {string} difficulty
 * @returns {object|null}
 */
export function getConvProgress(word, difficulty) {
  const prog = loadProgress()
  return prog[`${word}__${difficulty}`] ?? null
}

// ── Session Tracking (localStorage) ──────────────────────────

const SESSION_KEY = 'aguilang_conv_sessions'

export function saveSession({ profileId, packId, word, difficulty,
  totalExchanges, completedExchanges, pickScore, typeScore, speakScore,
  avgPronunciation, answers }) {

  const sessions = getSessionHistory()
  const totalScore = pickScore + typeScore + speakScore
  const session = {
    id: Date.now(),
    profileId,
    packId,
    word,
    difficulty,
    startedAt: new Date().toISOString(),
    totalExchanges,
    completedExchanges,
    pickScore,
    typeScore,
    speakScore,
    totalScore,
    avgPronunciation,
    isCompleted: completedExchanges >= totalExchanges,
    answers,
  }
  sessions.unshift(session)
  if (sessions.length > 200) sessions.splice(200)
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessions))
  return session
}

export function getSessionHistory() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || '[]')
  } catch { return [] }
}

export function getConvStats(profileId) {
  const sessions = getSessionHistory()
  const filtered = profileId
    ? sessions.filter(s => s.profileId === profileId)
    : sessions

  if (!filtered.length) return null

  const totalSessions = filtered.length
  const completedSessions = filtered.filter(s => s.isCompleted).length
  const totalScore = filtered.reduce((s, x) => s + x.totalScore, 0)
  const totalExchanges = filtered.reduce((s, x) => s + x.completedExchanges, 0)

  const allPron = filtered.map(s => s.avgPronunciation).filter(p => p > 0)
  const avgPronunciation = allPron.length
    ? Math.round(allPron.reduce((a, b) => a + b, 0) / allPron.length)
    : 0

  const allAnswers = filtered.flatMap(s => s.answers || [])
  const byMode = ['pick', 'type', 'speak'].map(mode => {
    const modeAnswers = allAnswers.filter(a => a.mode === mode)
    const correct = modeAnswers.filter(a => a.correct).length
    return {
      mode,
      attempts: modeAnswers.length,
      correct,
      accuracy: modeAnswers.length > 0
        ? Math.round((correct / modeAnswers.length) * 100)
        : 0,
    }
  }).filter(m => m.attempts > 0)

  const recentSessions = filtered.slice(0, 5)

  return { totalSessions, completedSessions, totalScore, totalExchanges, avgPronunciation, byMode, recentSessions }
}
