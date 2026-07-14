/**
 * AppContext — Global uygulama durumu (browser-compatible)
 *
 * DB yerine localStorage kullanır. Electron/Capacitor ortamında
 * profileQueries.js + srsEngine.js ile swap edilecek.
 *
 * Sağladıkları:
 *   profile, saveProfile, clearProfile
 *   currentPair, setCurrentPair
 *   getStudyWords(allWords, targetLang, limit) — SRS: sonraki kelimeler
 *   recordAnswer(wordId, isCorrect, quality)   — SRS: cevabı kaydet
 *   getStats(allWords)                          — SRS: ilerleme istatistikleri
 */

import { createContext, useContext, useState, useCallback } from 'react'

const PROFILE_KEY  = 'aguilang_active_profile'
const PAIR_KEY     = 'aguilang_active_pair'
const UI_LANG_KEY  = 'aguilang_ui_language'
const DEFAULT_PAIR = 5   // tr→en (TR uygulaması)

const AppContext = createContext(null)

function loadProfile() {
  try { const s = localStorage.getItem(PROFILE_KEY); return s ? JSON.parse(s) : null }
  catch { return null }
}

function loadPair() {
  try { const s = localStorage.getItem(PAIR_KEY); return s ? Number(JSON.parse(s)) : DEFAULT_PAIR }
  catch { return DEFAULT_PAIR }
}

function loadUiLanguage() {
  try { const s = localStorage.getItem(UI_LANG_KEY); return s ? JSON.parse(s) : 'tr' }
  catch { return 'tr' }
}

export function AppProvider({ children }) {
  const [profile,          setProfile]          = useState(loadProfile)
  const [currentPair, setCurrentPairState] = useState(loadPair)
  const [uiLanguage, setUiLanguageState]   = useState(loadUiLanguage)

  // ── Profile ────────────────────────────────────────────
  const saveProfile = useCallback((updates) => {
    setProfile(prev => {
      const next = { ...(prev ?? {}), ...updates }
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next))
      // Profilde ui_language varsa AppContext state'ini de güncelle
      if (updates.ui_language) {
        localStorage.setItem(UI_LANG_KEY, JSON.stringify(updates.ui_language))
        setUiLanguageState(updates.ui_language)
      }
      return next
    })
  }, [])

  const clearProfile = useCallback(() => {
    localStorage.removeItem(PROFILE_KEY)
    setProfile(null)
  }, [])

  // ── Language pair ──────────────────────────────────────
  const setCurrentPair = useCallback((pairId) => {
    localStorage.setItem(PAIR_KEY, JSON.stringify(pairId))
    setCurrentPairState(pairId)
  }, [])

  // ── UI language ────────────────────────────────────────
  const setUiLanguage = useCallback((lang) => {
    localStorage.setItem(UI_LANG_KEY, JSON.stringify(lang))
    setUiLanguageState(lang)
  }, [])

  return (
    <AppContext.Provider value={{
      profile, saveProfile, clearProfile,
      currentPair, setCurrentPair,
      uiLanguage, setUiLanguage,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
