/**
 * core/languages.js — Dil tanımları (tek kaynak)
 *
 * Kaynak dil: TR (sabit — bu bir Türkçe uygulaması)
 * Hedef diller: EN / ES / PT / DE
 *
 * Eski "pair" (dil çifti sayısal id) kavramı KALDIRILDI.
 * Artık yalnızca aktif hedef dil ('en'|'es'|'pt'|'de') tutulur.
 */
export const SOURCE_LANG = 'tr'

export const TARGET_LANGS = {
  en: { id: 'en', label: 'İngilizce', native: 'English',    flag: '🇬🇧', locale: 'en-GB', tts: 'en-US-JennyNeural'     },
  es: { id: 'es', label: 'İspanyolca', native: 'Español',   flag: '🇪🇸', locale: 'es-ES', tts: 'es-MX-DaliaNeural'     },
  pt: { id: 'pt', label: 'Portekizce', native: 'Português', flag: '🇧🇷', locale: 'pt-BR', tts: 'pt-BR-FranciscaNeural' },
  de: { id: 'de', label: 'Almanca',    native: 'Deutsch',   flag: '🇩🇪', locale: 'de-DE', tts: 'de-DE-KatjaNeural'     },
}

export const TARGET_LANG_IDS = Object.keys(TARGET_LANGS)

export const DEFAULT_TARGET = 'en'

export function isValidTarget(id) {
  return TARGET_LANG_IDS.includes(id)
}

export function localeOf(id) {
  return TARGET_LANGS[id]?.locale ?? 'en-GB'
}
