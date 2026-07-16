/**
 * SentenceMini.jsx — Karta gömülebilen küçük cümle kurma paneli.
 *
 * Kelime öğrenme sırasında, o kelimeyle AYNI YERDE cümle kurmak için.
 * Kelimeleri sıraya diz → doğruysa ses + XP.
 */
import { useState, useMemo, useEffect, useRef } from 'react'
import { useSpeech } from '../hooks/useSpeech'
import { checkAnswer, getPronunciationScore } from '../utils/fuzzyMatch'
import { addXp } from '../core/progressStore'
import * as sfx from '../core/sfx'

const words = (s) => (s || '').trim().split(/\s+/).filter(Boolean)
const shuffle = (a) => [...a].sort(() => Math.random() - 0.5)

export default function SentenceMini({ tr, target, lang, fn }) {
  const { speak, startListening, stopListening, isListening, transcript, sttSupported } = useSpeech(lang)
  const [picked, setPicked] = useState([])
  const [result, setResult] = useState(null)   // null | 'ok' | 'wrong'
  const [sayResult, setSayResult] = useState(null)  // { score } | null
  const heardRef = useRef(false)
  const bank = useMemo(() => shuffle(words(target)), [target])
  const built = picked.join(' ')

  // Hedef cümle değişince (yeni kelime veya "başka cümle") paneli sıfırla
  useEffect(() => { setPicked([]); setResult(null); setSayResult(null); heardRef.current = false }, [target])

  const check = () => {
    if (result === 'ok') return
    const r = checkAnswer(built, target)
    if (r.match || r.score >= 0.85) {
      setResult('ok'); sfx.correct(); addXp(3); speak(target)
    } else { setResult('wrong'); sfx.wrong() }
  }

  const reset = () => { setPicked([]); setResult(null) }

  // ── Söyle: mikrofon → telaffuz puanı ──
  const handleMic = () => {
    if (isListening) { stopListening(); return }
    setSayResult(null); heardRef.current = false
    startListening()
  }
  useEffect(() => {
    if (!transcript || isListening || heardRef.current) return
    heardRef.current = true
    const r = getPronunciationScore(transcript, target)
    setSayResult(r)
    if (r.score >= 55) { sfx.correct(); addXp(3) } else sfx.wrong()
  }, [transcript, isListening]) // eslint-disable-line

  return (
    <div style={S.wrap}>
      <div style={S.head}>🔗 Bu kelimeyle cümle kur{fn ? ` · ${fn}` : ''}</div>
      <div style={S.tr}>“{tr}”</div>

      {/* Dinle & Söyle — modeli duy, sonra tekrarla */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button onClick={() => speak(target)} style={{ ...S.act, background: '#EFF8FF', color: '#0891B2', borderColor: '#BAE6FD' }}>
          🔊 Dinle
        </button>
        {sttSupported && (
          <button onClick={handleMic}
            style={{ ...S.act, background: isListening ? '#FEE2E2' : '#F0FDF4',
                     color: isListening ? '#DC2626' : '#15803D',
                     borderColor: isListening ? '#FCA5A5' : '#BBF7D0' }}>
            {isListening ? '🔴 Dinliyorum...' : '🎤 Söyle'}
          </button>
        )}
      </div>
      {sayResult && (
        <div style={{ ...S.sayBox,
          background: sayResult.score >= 55 ? '#F0FDF4' : '#FEF3C7',
          borderColor: sayResult.score >= 55 ? '#BBF7D0' : '#FDE68A',
          color: sayResult.score >= 55 ? '#15803D' : '#92400E' }}>
          {sayResult.score >= 80 ? '🎉 Mükemmel telaffuz' : sayResult.score >= 55 ? '👍 Güzel söyledin' : '🙂 Tekrar dene'} · %{sayResult.score}
          {sayResult.score >= 55 ? ' +3 XP' : ''}
        </div>
      )}

      <div style={{ ...S.built, borderColor: result === 'wrong' ? '#FCA5A5' : result === 'ok' ? '#BBF7D0' : '#CBD5E1' }}>
        {picked.length === 0
          ? <span style={{ color: '#CBD5E1', fontSize: 13 }}>Kelimelere dokun...</span>
          : picked.map((w, i) => (
              <span key={i} onClick={() => result !== 'ok' && (setPicked(p => p.filter((_, j) => j !== i)), setResult(null))}
                    style={S.chip}>{w}{result !== 'ok' && ' ✕'}</span>
            ))}
      </div>

      {result !== 'ok' && (
        <div style={S.bank}>
          {bank.map((w, i) => {
            const used = picked.filter(p => p === w).length
            const avail = bank.filter(b => b === w).length
            const disabled = used >= avail
            return (
              <button key={i} disabled={disabled}
                onClick={() => { setPicked(p => [...p, w]); setResult(null) }}
                style={{ ...S.bankChip, opacity: disabled ? 0.3 : 1 }}>{w}</button>
            )
          })}
        </div>
      )}

      {result === 'ok' ? (
        <div style={{ ...S.banner, background: '#F0FDF4', borderColor: '#BBF7D0', color: '#15803D' }}>
          🎉 Aferin! “{target}” · +3 XP
          <button onClick={() => speak(target)} style={S.mini}>🔊</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={check} disabled={!picked.length}
            style={{ ...S.btn, background: '#0891B2', color: 'white', opacity: picked.length ? 1 : 0.5 }}>
            {result === 'wrong' ? 'Tekrar dene 🔁' : 'Kontrol Et ✓'}
          </button>
          {picked.length > 0 && (
            <button onClick={reset} style={{ ...S.btn, background: '#F1F5F9', color: '#64748B', flex: '0 0 auto', width: 44 }}>↺</button>
          )}
        </div>
      )}
    </div>
  )
}

const S = {
  wrap: { background: '#FBFCFD', border: '1px solid #E2E8F0', borderRadius: 14, padding: 14, marginTop: 12, textAlign: 'left' },
  head: { fontSize: 12, fontWeight: 800, color: '#0891B2', marginBottom: 6 },
  tr: { fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 10 },
  built: { minHeight: 44, background: 'white', border: '1.5px dashed #CBD5E1', borderRadius: 10, padding: 8, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 8 },
  chip: { background: '#EFF8FF', border: '1px solid #BAE6FD', color: '#0369A1', borderRadius: 7, padding: '5px 9px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  bank: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  bankChip: { background: 'white', border: '1px solid #E2E8F0', borderRadius: 7, padding: '7px 11px', fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' },
  btn: { flex: 1, height: 42, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  banner: { border: '1px solid', borderRadius: 10, padding: '10px 12px', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  mini: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 15 },
  act: { flex: 1, height: 40, border: '1.5px solid', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  sayBox: { border: '1px solid', borderRadius: 10, padding: '8px 12px', fontSize: 13, fontWeight: 700, textAlign: 'center', marginBottom: 8 },
}
