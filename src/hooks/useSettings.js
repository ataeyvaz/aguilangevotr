import { useState, useCallback } from 'react'

const SETTINGS_KEY = 'aguilang_settings'

export const DEFAULT_SETTINGS = {
  ttsEnabled:     true,
  ttsRate:        0.9,    // 0.5 – 1.5
  dailyCardGoal:  10,     // hedef kart sayısı
  dailyQuizGoal:  1,      // hedef quiz sayısı
  pin:            '1234',
}

function load() {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') } }
  catch { return { ...DEFAULT_SETTINGS } }
}

export function useSettings() {
  const [settings, setSettings] = useState(load)

  const save = useCallback((patch) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  return { settings, save }
}

/** useSpeech gibi yerde ayarları doğrudan okumak için yardımcı */
export function readSettings() {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') } }
  catch { return { ...DEFAULT_SETTINGS } }
}
