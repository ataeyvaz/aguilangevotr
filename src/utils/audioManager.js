/**
 * audioManager.js — Kelime/cümle telaffuzu.
 *
 * Öncelik: gerçek MP3 kaydı (public/audio/{lang}/{kelime}.mp3) → yoksa TTS.
 * MP3 dosyaları KELİME adıyla kayıtlı (id ile DEĞİL): elma.mp3, big.mp3,
 * banyo_odası.mp3 (küçük harf, boşluk → alt çizgi, Unicode korunur).
 * Bu yüzden dosya adını her zaman metinden üretiriz, id'den değil.
 *
 * TTS: Native (APK) → @capacitor-community/text-to-speech, Web → speechSynthesis.
 * TÜM diller desteklenir (tr, en, es, pt, de).
 */

// Native TTS için tam yerel kod (locale)
const SPEECH_LANGS = {
  tr: 'tr-TR',
  en: 'en-GB',
  de: 'de-DE',
  es: 'es-ES',
  pt: 'pt-BR',
  it: 'it-IT',
}

let currentAudio = null

// "banyo odası" → "banyo_odası", "Big" → "big", "yaşlı / eski" → "yaşlı"
// (MP3 dosya adı kuralı — generate_all_missing.py ile BİREBİR aynı olmalı)
const toFileName = (text) =>
  (text || '')
    .split(/[/\\]/)[0]             // "a / b" ikili anlam → birincil terim
    .toLowerCase()
    .trim()
    .replace(/[.!?¿¡,;:"'`<>|*]/g, '') // dosya-güvensiz noktalama at
    .replace(/\s+/g, '_')

const playMP3 = (text, lang) => {
  return new Promise((resolve, reject) => {
    const name = toFileName(text)
    if (!name) { reject(new Error('empty')); return }
    const path = `/audio/${lang}/${name}.mp3`
    const audio = new Audio(path)
    currentAudio = audio
    audio.onended = resolve
    audio.onerror = reject
    // play() bazı tarayıcılarda reddedebilir → yakala, TTS'e düş
    const p = audio.play()
    if (p && typeof p.catch === 'function') p.catch(reject)
  })
}

function isNative() {
  try { return window?.Capacitor?.isNativePlatform?.() ?? false } catch { return false }
}

// Native TTS (lazy) — WebView'de speechSynthesis çalışmaz
let _tts = null, _ttsReady = false
async function nativeSpeak(text, locale) {
  if (!_ttsReady) {
    try { const m = await import('@capacitor-community/text-to-speech'); _tts = m.TextToSpeech } catch { _tts = null }
    _ttsReady = true
  }
  if (!_tts) return
  try { await _tts.stop() } catch {}
  try { await _tts.speak({ text, lang: locale, rate: 0.85, pitch: 1.1, volume: 1.0, category: 'playback' }) } catch {}
}

const playTTS = (text, lang) => {
  const locale = SPEECH_LANGS[lang] || 'en-GB'
  return new Promise((resolve) => {
    if (isNative()) { nativeSpeak(text, locale).finally(resolve); return }
    if (!window.speechSynthesis) { resolve(); return }
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = locale
    utter.rate = 0.85
    utter.pitch = 1.1
    utter.onend = resolve
    utter.onerror = resolve

    const pickVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices()
      const base = locale.split('-')[0]
      // Önce tam yerel kod (tr-TR), sonra dil kökü (tr) eşleşen ses
      const voice =
        voices.find(v => v.lang?.toLowerCase() === locale.toLowerCase()) ||
        voices.find(v => v.lang?.toLowerCase().startsWith(base))
      if (voice) utter.voice = voice
      window.speechSynthesis.speak(utter)
    }

    if (window.speechSynthesis.getVoices().length > 0) {
      pickVoiceAndSpeak()
    } else {
      // Sesler henüz yüklenmediyse bekle
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null
        pickVoiceAndSpeak()
      }
    }
  })
}

/**
 * @param {string} _wordId  (kullanılmıyor — geriye dönük uyumluluk için)
 * @param {string} text     seslendirilecek kelime/cümle
 * @param {string} lang     'tr' | 'en' | 'es' | 'pt' | 'de'
 */
export const speak = async (_wordId, text, lang = 'en') => {
  if (!text) return
  stopAudio()
  try {
    await playMP3(text, lang)
  } catch {
    await playTTS(text, lang)
  }
}

export const stopAudio = () => {
  if (currentAudio) {
    try { currentAudio.pause() } catch {}
    currentAudio = null
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}
