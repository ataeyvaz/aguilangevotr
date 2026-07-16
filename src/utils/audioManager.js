const VOICES = {
  en: 'en-GB-SoniaNeural',
  de: 'de-DE-KatjaNeural',
  es: 'es-ES-ElviraNeural',
  it: 'it-IT-ElsaNeural',
}

const SPEECH_LANGS = {
  en: 'en-GB',
  de: 'de-DE',
  es: 'es-ES',
  it: 'it-IT',
}

let currentAudio = null

const playMP3 = (wordId, lang) => {
  return new Promise((resolve, reject) => {
    const path = `/audio/${lang}/${wordId}.mp3`
    const audio = new Audio(path)
    currentAudio = audio
    audio.onended = resolve
    audio.onerror = reject
    audio.play()
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
  return new Promise((resolve) => {
    if (isNative()) { nativeSpeak(text, SPEECH_LANGS[lang] || 'en-GB').finally(resolve); return }
    if (!window.speechSynthesis) { resolve(); return }
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = SPEECH_LANGS[lang] || 'en-GB'
    utter.rate = 0.85
    utter.onend = resolve

    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        const voice = voices.find(v =>
          v.lang.startsWith(utter.lang.split('-')[0])
        )
        if (voice) utter.voice = voice
        window.speechSynthesis.speak(utter)
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          const v = window.speechSynthesis.getVoices()
          const voice = v.find(x => x.lang.startsWith(utter.lang.split('-')[0]))
          if (voice) utter.voice = voice
          window.speechSynthesis.speak(utter)
        }
      }
    }
    trySpeak()
  })
}

export const speak = async (wordId, text, lang = 'en') => {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
  try {
    await playMP3(wordId, lang)
  } catch {
    await playTTS(text, lang)
  }
}

export const stopAudio = () => {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}