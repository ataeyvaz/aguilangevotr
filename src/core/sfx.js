/**
 * core/sfx.js — Basit ses efektleri (Web Audio API, dosya gerektirmez)
 *
 * Çocuklar için anında işitsel geri bildirim: doğru/yanlış/ödül.
 * Tarayıcıda oynatılır; kullanıcı etkileşimiyle (tık) tetiklendiği için
 * AudioContext otoplay kısıtına takılmaz.
 *
 * Kapatma: aguilang_settings.sfxEnabled === false (ProfilePage anahtarı)
 */
let _ctx = null

function enabled() {
  try { return JSON.parse(localStorage.getItem('aguilang_settings') || '{}').sfxEnabled !== false }
  catch { return true }
}
export function isSfxEnabled() {
  return enabled()
}

function ctx() {
  if (!_ctx) {
    try { _ctx = new (window.AudioContext || window.webkitAudioContext)() }
    catch { _ctx = null }
  }
  if (_ctx?.state === 'suspended') _ctx.resume().catch(() => {})
  return _ctx
}

/** Tek bir nota çal. */
function tone(freq, start, dur, { type = 'sine', gain = 0.15 } = {}) {
  const c = ctx()
  if (!c) return
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  const t0 = c.currentTime + start
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

/** Doğru — neşeli yükselen arpej (C-E-G). */
export function correct() {
  if (!enabled()) return
  tone(523.25, 0,    0.12)  // C5
  tone(659.25, 0.10, 0.12)  // E5
  tone(783.99, 0.20, 0.18)  // G5
}

/** Yanlış — yumuşak, cezalandırıcı olmayan iki alçak nota. */
export function wrong() {
  if (!enabled()) return
  tone(311.13, 0,    0.16, { type: 'triangle', gain: 0.12 })  // Eb4
  tone(233.08, 0.14, 0.22, { type: 'triangle', gain: 0.12 })  // Bb3
}

/** Ödül — bölüm/senaryo bitişi için kısa kutlama melodisi. */
export function reward() {
  if (!enabled()) return
  const notes = [523.25, 659.25, 783.99, 1046.5]  // C5 E5 G5 C6
  notes.forEach((f, i) => tone(f, i * 0.11, 0.20, { gain: 0.16 }))
}

/** Nötr tık (kart çevirme vb.). */
export function tap() {
  if (!enabled()) return
  tone(880, 0, 0.05, { type: 'square', gain: 0.05 })
}
