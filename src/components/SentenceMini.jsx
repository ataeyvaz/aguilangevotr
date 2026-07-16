/**
 * SentenceMini.jsx — Karta gömülebilen küçük cümle kurma paneli.
 *
 * Kelime öğrenme sırasında, o kelimeyle AYNI YERDE cümle kurmak için.
 * Kelimeleri sıraya diz → doğruysa ses + XP.
 */
import { useState, useMemo } from 'react'
import { useSpeech } from '../hooks/useSpeech'
import { checkAnswer } from '../utils/fuzzyMatch'
import { addXp } from '../core/progressStore'
import * as sfx from '../core/sfx'

const words = (s) => (s || '').trim().split(/\s+/).filter(Boolean)
const shuffle = (a) => [...a].sort(() => Math.random() - 0.5)

export default function SentenceMini({ tr, target, lang }) {
  const { speak } = useSpeech(lang)
  const [picked, setPicked] = useState([])
  const [result, setResult] = useState(null)   // null | 'ok' | 'wrong'
  const bank = useMemo(() => shuffle(words(target)), [target])
  const built = picked.join(' ')

  const check = () => {
    if (result === 'ok') return
    const r = checkAnswer(built, target)
    if (r.match || r.score >= 0.85) {
      setResult('ok'); sfx.correct(); addXp(3); speak(target)
    } else { setResult('wrong'); sfx.wrong() }
  }

  const reset = () => { setPicked([]); setResult(null) }

  return (
    <div style={S.wrap}>
      <div style={S.head}>🔗 Bu kelimeyle cümle kur</div>
      <div style={S.tr}>“{tr}”</div>

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
}
