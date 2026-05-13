/**
 * useParentControls — Gelişmiş ebeveyn yetki sistemi
 *
 * localStorage anahtarları:
 *   aguilang_lang_settings      → { enabled: string[], priority: string }
 *   aguilang_energy_mode        → { mode: 'low'|'medium'|'high'|'custom', custom: {...} }
 *   aguilang_active_categories  → string[]   (aktif kategori id'leri)
 *   aguilang_time_settings      → { startHour, startMin, endHour, endMin, weekendEnabled }
 *   aguilang_vacation_mode      → { active: boolean }
 *   aguilang_notifications      → { onComplete, streakWarning, weeklyReport }
 */

const KEYS = {
  lang:         'aguilang_lang_settings',
  energy:       'aguilang_energy_mode',
  categories:   'aguilang_active_categories',
  time:         'aguilang_time_settings',
  vacation:     'aguilang_vacation_mode',
  notifs:       'aguilang_notifications',
  speechQuiz:   'aguilang_speech_quiz',
}

export const ENERGY_PRESETS = {
  low:    { cardLimit: 5,  durationMinutes: 10, quizEnabled: false, gameEnabled: false },
  medium: { cardLimit: 10, durationMinutes: 15, quizEnabled: true,  gameEnabled: true  },
  high:   { cardLimit: 20, durationMinutes: 25, quizEnabled: true,  gameEnabled: true  },
}

const ALL_CATEGORY_IDS = [
  'animals','colors','numbers','fruits','vegetables','body','family',
  'school','food','greetings','questions','clothing','home','transport',
  'time','jobs','sports','places','adjectives','verbs',
]

const DEFAULTS = {
  lang:       { enabled: ['en', 'es', 'pt'], priority: 'en' },
  energy:     { mode: 'medium', custom: { cardLimit: 10, durationMinutes: 15, quizEnabled: true, gameEnabled: false } },
  categories: ALL_CATEGORY_IDS,
  time:       { startHour: 14, startMin: 0, endHour: 20, endMin: 0, weekendEnabled: true },
  vacation:   { active: false },
  notifs:     { onComplete: true, streakWarning: true, weeklyReport: true },
}

function load(key, def) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : def
  } catch { return def }
}

function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val))
}

// ── Okuma (hook dışında da kullanılabilir) ─────────────────────

export function readLangSettings()     { return load(KEYS.lang,       DEFAULTS.lang)       }
export function readEnergyMode()       { return load(KEYS.energy,     DEFAULTS.energy)     }
export function readActiveCategories() { return load(KEYS.categories, DEFAULTS.categories) }
export function readTimeSettings()     { return load(KEYS.time,       DEFAULTS.time)       }
export function readVacationMode()     { return load(KEYS.vacation,   DEFAULTS.vacation)   }
export function readNotifSettings()    { return load(KEYS.notifs,     DEFAULTS.notifs)     }
export function readSpeechQuiz()       { return load(KEYS.speechQuiz, true)                }

/**
 * Zaman kısıtlaması aktif mi? (şu an çalışma saati dışında mı)
 * Döner: { blocked: boolean, message: string }
 */
export function checkTimeRestriction() {
  const ts = readTimeSettings()
  const vac = readVacationMode()

  if (vac.active) return { blocked: false } // tatildeyse engelleme yok

  const now = new Date()
  const day = now.getDay() // 0=Sun, 6=Sat
  const isWeekend = day === 0 || day === 6

  if (isWeekend && !ts.weekendEnabled) {
    return { blocked: true, message: 'Hafta sonu ders yok! Dinlen. 🏖️' }
  }

  const nowMins = now.getHours() * 60 + now.getMinutes()
  const startMins = ts.startHour * 60 + ts.startMin
  const endMins   = ts.endHour   * 60 + ts.endMin

  if (nowMins < startMins || nowMins >= endMins) {
    const pad = n => String(n).padStart(2, '0')
    const startStr = `${pad(ts.startHour)}:${pad(ts.startMin)}`
    return {
      blocked: true,
      message: `Not study time yet 🦅\nSee you at ${startStr}!`,
    }
  }

  return { blocked: false }
}

/**
 * Enerji modundan plan patch'i döner (cardLimit, durationMinutes, quizEnabled, gameEnabled)
 */
export function getEnergyPatch() {
  const em = readEnergyMode()
  if (em.mode === 'custom') return em.custom ?? ENERGY_PRESETS.medium
  return ENERGY_PRESETS[em.mode] ?? ENERGY_PRESETS.medium
}

// ── Hook ──────────────────────────────────────────────────────

export function useParentControls() {
  // Her render'da localStorage'dan oku (hafif, senkron)
  const langSettings     = readLangSettings()
  const energyMode       = readEnergyMode()
  const activeCategories = readActiveCategories()
  const timeSettings     = readTimeSettings()
  const vacationMode     = readVacationMode()
  const notifSettings    = readNotifSettings()
  const speechQuiz       = readSpeechQuiz()

  // ── Dil ayarları ──
  const setLangEnabled = (langId, enabled) => {
    const current = readLangSettings()
    let next = enabled
      ? [...new Set([...current.enabled, langId])]
      : current.enabled.filter(l => l !== langId)
    if (next.length === 0) next = [langId] // en az 1 zorunlu
    save(KEYS.lang, { ...current, enabled: next })
  }

  const setLangPriority = (langId) => {
    const current = readLangSettings()
    // priority dil mutlaka enabled olmalı
    const enabled = current.enabled.includes(langId)
      ? current.enabled
      : [...current.enabled, langId]
    save(KEYS.lang, { ...current, priority: langId, enabled })
  }

  // ── Enerji modu ──
  const setEnergyMode = (mode, customPatch = null) => {
    const current = readEnergyMode()
    save(KEYS.energy, {
      mode,
      custom: customPatch ?? current.custom ?? ENERGY_PRESETS.medium,
    })
  }

  const setCustomEnergy = (patch) => {
    const current = readEnergyMode()
    save(KEYS.energy, { mode: 'custom', custom: { ...(current.custom ?? ENERGY_PRESETS.medium), ...patch } })
  }

  // ── Aktif kategoriler ──
  const setCategoryEnabled = (catId, enabled) => {
    const current = readActiveCategories()
    let next = enabled
      ? [...new Set([...current, catId])]
      : current.filter(c => c !== catId)
    if (next.length < 3) return // en az 3 kategori zorunlu
    save(KEYS.categories, next)
  }

  // ── Zaman ayarları ──
  const setTimeSettings = (patch) => {
    const current = readTimeSettings()
    save(KEYS.time, { ...current, ...patch })
  }

  // ── Tatil modu ──
  const setVacationMode = (active) => {
    save(KEYS.vacation, { active })
  }

  // ── Bildirimler ──
  const setNotif = (key, val) => {
    const current = readNotifSettings()
    save(KEYS.notifs, { ...current, [key]: val })
  }

  const setSpeechQuiz = (val) => save(KEYS.speechQuiz, val)

  return {
    langSettings,
    energyMode,
    activeCategories,
    timeSettings,
    vacationMode,
    notifSettings,
    speechQuiz,
    // setters
    setLangEnabled,
    setLangPriority,
    setEnergyMode,
    setCustomEnergy,
    setCategoryEnabled,
    setTimeSettings,
    setVacationMode,
    setNotif,
    setSpeechQuiz,
  }
}
