/**
 * core/langState.js — TEK aktif hedef dil kaynağı (Faz B)
 *
 * Ana anahtar: aguilang_active_lang  → tüm sayfaların (eski dahil) yazdığı yer.
 * Bu modül onu KANONİK kabul eder; getLang her zaman onu öncelikli okur.
 * Böylece dili kim değiştirirse değiştirsin (setLang çağırmasa bile) içerik takip eder.
 *
 * 'pair' (sayısal çift) kavramı KALDIRILDI. Sadece 'en'|'es'|'pt'|'de'.
 */
import { useState, useEffect } from 'react'
import { DEFAULT_TARGET, isValidTarget } from './languages'
import { recordLangUsed } from './progressStore'

const KEY = 'aguilang_lang'          // ikincil (senkron tutulur)
const ACTIVE = 'aguilang_active_lang' // ana anahtar (eski + yeni sayfalar)
const listeners = new Set()

const PAIR = { 1: 'es', 2: 'pt', 3: 'en', 4: 'en', 5: 'en', 6: 'es', 7: 'pt', 8: 'de' }

function readId(raw) {
  try {
    const v = JSON.parse(raw)
    return typeof v === 'string' ? v : v?.id
  } catch { return null }
}

export function getLang() {
  // 1) aguilang_active_lang — ana kaynak ({id}, "en", veya tam nesne olabilir)
  const rawActive = localStorage.getItem(ACTIVE)
  if (rawActive) {
    const id = readId(rawActive)
    if (isValidTarget(id)) return id
  }
  // 2) aguilang_lang
  const v = localStorage.getItem(KEY)
  if (isValidTarget(v)) return v
  // 3) eski 'pair' (sayısal)
  const rawPair = localStorage.getItem('aguilang_active_pair')
  if (rawPair != null) {
    try { const id = PAIR[Number(JSON.parse(rawPair))]; if (isValidTarget(id)) return id } catch { /* yoksay */ }
  }
  return DEFAULT_TARGET
}

export function setLang(id) {
  if (!isValidTarget(id)) return
  localStorage.setItem(KEY, id)
  localStorage.setItem(ACTIVE, JSON.stringify({ id }))
  try { recordLangUsed(id) } catch { /* yoksay */ }
  listeners.forEach(fn => fn(id))
  // Eski sayfaların dinlediği olayı da tetikle (QuizScreen/FlashCards sync)
  try { window.dispatchEvent(new Event('aguilang_lang_changed')) } catch { /* yoksay */ }
}

export function useLang() {
  const [lang, setLangState] = useState(getLang)
  useEffect(() => {
    const refresh = () => setLangState(getLang())
    listeners.add(refresh)
    // Başka bir yol dili değiştirdiyse (setLang'siz) yakala
    window.addEventListener('aguilang_lang_changed', refresh)
    window.addEventListener('storage', refresh)
    refresh()   // mount anında en güncel değeri al
    return () => {
      listeners.delete(refresh)
      window.removeEventListener('aguilang_lang_changed', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])
  return [lang, setLang]
}
