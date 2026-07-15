/**
 * ChainMode.jsx — "Cümle Zinciri" (cümleler nasıl büyür)
 *
 * Kısa çekirdek cümle → adım adım genişler. Her adımda eklenen
 * kelimeler vurgulanır → çocuk cümlelerin nasıl uzadığını görür.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../core/langState'
import { TARGET_LANGS } from '../core/languages'
import { useSpeech } from '../hooks/useSpeech'
import { CHAINS } from '../data/patterns'
import { addXp } from '../core/progressStore'
import * as sfx from '../core/sfx'

const words = (s) => (s || '').trim().split(/\s+/).filter(Boolean)

export default function ChainMode() {
  const navigate = useNavigate()
  const [lang] = useLang()
  const { speak } = useSpeech(lang)

  const [ci, setCi]   = useState(0)
  const [step, setStep] = useState(0)
  const [started, setStarted] = useState(false)

  const chain = CHAINS[ci]
  const steps = chain[lang] || chain.en
  const cur = steps[step]
  const prev = step > 0 ? steps[step - 1] : ''

  // Adım değişince seslendir
  useEffect(() => {
    if (started && cur) { const t = setTimeout(() => speak(cur), 350); return () => clearTimeout(t) }
  }, [step, ci, started]) // eslint-disable-line

  const prevSet = new Set(words(prev).map(w => w.toLowerCase()))

  const grow = () => {
    if (step + 1 < steps.length) { sfx.tap?.(); setStep(step + 1) }
    else nextChain()
  }
  const nextChain = () => {
    addXp(6); sfx.correct()
    if (ci + 1 >= CHAINS.length) { sfx.reward(); setStarted(false); setCi(0); setStep(0) }
    else { setCi(ci + 1); setStep(0) }
  }

  if (!started) {
    return (
      <div style={S.page}>
        <Header onBack={() => navigate('/learn-hub')} lang={lang} />
        <div style={{ ...S.body, alignItems: 'center', textAlign: 'center', paddingTop: 36 }}>
          <div style={{ fontSize: 60 }}>🔗</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Cümle Zinciri</div>
          <div style={{ fontSize: 15, color: '#64748B', maxWidth: 330, lineHeight: 1.6 }}>
            Kısa bir cümle adım adım büyür. Her adımda <b>eklenen kelimeler</b>
            renklenir — cümlelerin nasıl uzadığını gör! 🔗
          </div>
          <button onClick={() => { setStarted(true); setCi(0); setStep(0) }}
            style={{ ...S.primary, maxWidth: 280 }}>Başla ({CHAINS.length} zincir)</button>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      <Header onBack={() => setStarted(false)} lang={lang} right={`${ci + 1}/${CHAINS.length}`} />
      <div style={S.body}>
        <div style={S.noteBox}>🔗 {chain.note}</div>

        {/* Basamak göstergesi */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {steps.map((_, i) => (
            <div key={i} style={{ width: 28, height: 6, borderRadius: 3, background: i <= step ? '#0891B2' : '#E2E8F0' }} />
          ))}
        </div>

        {/* Büyüyen cümle (yeni kelimeler vurgulu) */}
        <div style={S.card} onClick={() => speak(cur)}>
          <div style={S.sentence}>
            {words(cur).map((w, i) => {
              const isNew = step > 0 && !prevSet.has(w.toLowerCase())
              return (
                <span key={i} style={{
                  color: isNew ? '#0891B2' : '#0F172A',
                  background: isNew ? '#EFF8FF' : 'transparent',
                  borderRadius: 6, padding: isNew ? '0 4px' : 0, marginRight: 5,
                  fontWeight: isNew ? 800 : 700,
                }}>{w}</span>
              )
            })}
          </div>
          <div style={S.tr}>{(chain.tr || [])[step]}</div>
          <div style={S.play}>🔊 Dinlemek için dokun</div>
        </div>

        <button onClick={grow} style={S.primary}>
          {step + 1 < steps.length ? 'Uzat →' : (ci + 1 >= CHAINS.length ? 'Bitir 🏁' : 'Sonraki Zincir →')}
        </button>
      </div>
    </div>
  )
}

function Header({ onBack, right, lang }) {
  return (
    <div style={S.header}>
      <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={S.back}>←</button>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
          🔗 Cümle Zinciri <span style={{ color: '#94A3B8', fontWeight: 500 }}>· {TARGET_LANGS[lang]?.flag}</span>
        </div>
        {right && <div style={S.counter}>{right}</div>}
      </div>
    </div>
  )
}

const S = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  header: { background: 'white', borderBottom: '1px solid #E2E8F0', padding: '12px 18px', position: 'sticky', top: 0, zIndex: 10 },
  back: { background: '#F1F5F9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16 },
  counter: { background: '#EFF8FF', borderRadius: 8, padding: '4px 12px', fontSize: 13, fontWeight: 700, color: '#0891B2' },
  body: { maxWidth: 560, margin: '0 auto', padding: '20px 24px 48px', display: 'flex', flexDirection: 'column', gap: 14 },
  noteBox: { background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#92400E' },
  card: { background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: 28, textAlign: 'center', cursor: 'pointer' },
  sentence: { fontSize: 24, lineHeight: 1.5, color: '#0F172A' },
  tr: { fontSize: 14, color: '#94A3B8', marginTop: 10 },
  play: { fontSize: 12, color: '#0891B2', marginTop: 8 },
  primary: { height: 52, background: '#0891B2', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, color: 'white', cursor: 'pointer', width: '100%' },
}
