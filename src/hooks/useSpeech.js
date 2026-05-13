import { useState, useEffect, useRef, useCallback } from 'react'
import { readSettings } from './useSettings'

const LANG_MAP = {
  en: 'en-GB',
  de: 'de-DE',
  es: 'es-ES',
  tr: 'tr-TR',
  pt: 'pt-BR',
}

// Plugin is stored here after loading — never returned through a Promise chain.
// Reason: the Capacitor proxy has a `then` getter (via its Proxy trap), making it
// thenable. Returning it from an async function or Promise.resolve() causes JS to
// call proxy.then(resolve, reject) → "SpeechRecognition.then() is not implemented".
let _plugin = null
let _pluginReady = false
let _pluginLoadPromise = null

function ensurePlugin() {
  if (_pluginReady) return Promise.resolve()
  if (_pluginLoadPromise) return _pluginLoadPromise
  _pluginLoadPromise = import('@capacitor-community/speech-recognition')
    .then(mod => { _plugin = mod.SpeechRecognition })
    .catch(() => { _plugin = null })
    .finally(() => { _pluginReady = true; _pluginLoadPromise = null })
  return _pluginLoadPromise
}

function isNative() {
  try {
    return window?.Capacitor?.isNativePlatform?.() ?? false
  } catch {
    return false
  }
}

/**
 * useSpeech — TTS + STT tek hook
 * Native (Android/iOS): @capacitor-community/speech-recognition
 * Web: Web Speech API
 * @param {string} langId  'en' | 'de' | 'es' | 'pt' | 'tr'
 */
export function useSpeech(langId) {
  const locale = LANG_MAP[langId] ?? 'en-GB'

  // ── TTS ──────────────────────────────────────────────
  const [isSpeaking, setIsSpeaking] = useState(false)
  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const speak = useCallback((text, { rate, pitch = 1.1, lang } = {}) => {
    if (!ttsSupported) return
    const settings = readSettings()
    if (settings.ttsEnabled === false) return
    const finalRate = rate ?? settings.ttsRate ?? 0.85
    const finalLang = lang ?? locale

    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null
          trySpeak()
        }
        return
      }
      const utt = new SpeechSynthesisUtterance(text)
      utt.lang = finalLang
      const voice = voices.find(v => v.lang.startsWith(finalLang.split('-')[0]))
      if (voice) utt.voice = voice
      utt.rate = finalRate
      utt.pitch = pitch
      utt.onstart = () => setIsSpeaking(true)
      utt.onend   = () => setIsSpeaking(false)
      utt.onerror = () => setIsSpeaking(false)
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utt)
    }

    trySpeak()
  }, [locale, ttsSupported])

  const stopSpeaking = useCallback(() => {
    if (ttsSupported) window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [ttsSupported])

  useEffect(() => {
    return () => { if (ttsSupported) window.speechSynthesis.cancel() }
  }, [ttsSupported])

  // ── STT ──────────────────────────────────────────────
  const WebSpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition ?? window.webkitSpeechRecognition
      : null

  // Native platformda plugin var sayılır; web'de WebSpeechRecognition'a bak
  const sttSupported = isNative() ? true : Boolean(WebSpeechRecognition)

  const recognizerRef = useRef(null)
  const [isListening, setIsListening] = useState(false)
  const [transcript,  setTranscript]  = useState('')
  const [sttError,    setSttError]    = useState(null)

  // ── Native STT ────────────────────────────────────────
  const timeoutRef = useRef(null);
  const startNativeListening = useCallback(async () => {
    // Clear any existing timeout before starting
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    await ensurePlugin()
    const plugin = _plugin  // sync access — never await the proxy directly
    if (!plugin) return

    try {
      const { available } = await plugin.available()
      if (!available) { setSttError('unavailable'); return }

      const perm = await plugin.requestPermissions()
      if (perm?.speechRecognition !== 'granted') {
        setSttError('permission-denied')
        return
      }

      setSttError(null)
      setTranscript('')
      await plugin.removeAllListeners()

      await plugin.addListener('partialResults', (data) => {
        const text = data?.matches?.[0]?.toLowerCase().trim() ?? ''
        if (text) setTranscript(text)
      })

      setIsListening(true)

      plugin.start({
        language: locale,
        maxResults: 1,
        prompt: 'Speak now',
        partialResults: true,
        popup: false,
      })
      // Set a timeout to automatically stop listening after 5 seconds of inactivity
      timeoutRef.current = setTimeout(async () => {
        await stopNativeListening()
        setIsListening(false)
      }, 5000)

    } catch (e) {
      setSttError(e?.message ?? 'error')
      setIsListening(false)
    }
  }, [locale])

  // Unified stop function that always clears isListening first
const sttStop = useCallback(async () => {
  // Ensure listening flag is cleared no matter what
  setIsListening(false);
  // Clear any pending timeout
  if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  if (isNative()) {
    try {
      await _plugin?.removeAllListeners();
      await _plugin?.stop();
    } catch (e) { /* ignore errors */ }
  } else {
    // Web: stop the SpeechRecognition instance if it exists
    recognizerRef.current?.stop();
  }
}, []);
const stopNativeListening = sttStop;

  // ── Web STT ───────────────────────────────────────────
  const startWebListening = useCallback(() => {
    if (!WebSpeechRecognition || isListening) return
    setSttError(null)
    setTranscript('')

    const rec = new WebSpeechRecognition()
    rec.lang = locale
    rec.interimResults = false
    rec.maxAlternatives = 1

    rec.onstart  = () => setIsListening(true)
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript.trim().toLowerCase()
      setTranscript(text)
    }
    rec.onerror = (e) => { setSttError(e.error); setIsListening(false) }
    rec.onend   = () => setIsListening(false)

    recognizerRef.current = rec
    rec.start()
  }, [locale, WebSpeechRecognition, isListening])

  const stopWebListening = useCallback(() => {
    recognizerRef.current?.stop()
    setIsListening(false)
  }, [])

  // ── Unified interface ─────────────────────────────────
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Ensure any timeout cleared and listeners removed
      if (isNative()) {
        // Stop native listening and cleanup
        stopNativeListening();
      } else {
        clearTimeout?.(timeoutRef.current);
        setIsListening(false);
      }
    };
  }, []);
  const startListening = isNative() ? startNativeListening : startWebListening
  const stopListening  = isNative() ? stopNativeListening  : stopWebListening

  const checkAnswer = useCallback((expected) => {
    if (!expected || !transcript) return false
    const t = transcript.toLowerCase().trim()
    const e = expected.toLowerCase().trim()
    return t === e || t.includes(e) || e.includes(t)
  }, [transcript])

  return {
    // TTS
    speak,
    stopSpeaking,
    isSpeaking,
    ttsSupported,
    // STT
    startListening,
    stopListening,
    isListening,
    transcript,
    sttError,
    sttSupported,
    checkAnswer,
    // Unified stop
    sttStop,
    // Meta
    locale,
  }
}

