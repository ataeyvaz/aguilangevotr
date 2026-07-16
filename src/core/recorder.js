/**
 * recorder.js — Basit ses kaydedici (MediaRecorder).
 * Hem web'de hem Android WebView'de çalışır (mikrofon izniyle).
 * Kaydı bir blob URL olarak döndürür → new Audio(url).play() ile dinlenir.
 */
let _rec = null
let _stream = null
let _chunks = []
let _lastUrl = null

export function isRecordingSupported() {
  return typeof navigator !== 'undefined'
    && !!navigator.mediaDevices?.getUserMedia
    && typeof MediaRecorder !== 'undefined'
}

/** Kaydı başlat. Mikrofon izni ister. */
export async function startRecording() {
  _stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  _chunks = []
  // Bazı WebView'lerde mimeType desteği değişir — güvenli seçim
  let opts = {}
  if (MediaRecorder.isTypeSupported?.('audio/webm')) opts = { mimeType: 'audio/webm' }
  else if (MediaRecorder.isTypeSupported?.('audio/mp4')) opts = { mimeType: 'audio/mp4' }
  _rec = new MediaRecorder(_stream, opts)
  _rec.ondataavailable = (e) => { if (e.data && e.data.size) _chunks.push(e.data) }
  _rec.start()
}

/** Kaydı durdur → blob URL döndür. */
export function stopRecording() {
  return new Promise((resolve) => {
    if (!_rec) return resolve(null)
    _rec.onstop = () => {
      const type = _rec.mimeType || 'audio/webm'
      const blob = new Blob(_chunks, { type })
      if (_lastUrl) { try { URL.revokeObjectURL(_lastUrl) } catch { /* yoksay */ } }
      _lastUrl = URL.createObjectURL(blob)
      _stream?.getTracks().forEach(t => t.stop())
      _rec = null; _stream = null
      resolve(_lastUrl)
    }
    try { _rec.stop() } catch { resolve(null) }
  })
}

export function isRecording() {
  return !!_rec && _rec.state === 'recording'
}
