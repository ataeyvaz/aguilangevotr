/**
 * ChainMode.jsx — "Cümle Zinciri" (botla interaktif cümle büyütme)
 *
 * Bot çocukla SOHBET ederek cümleyi adım adım büyütür:
 *  Bot: "Şunu kur: 'Koşuyorum'"  → çocuk kelimeleri dizer
 *  Bot: "Süper! Şimdi uzat →"     → 'Hızlı koşuyorum'
 *  Bot: "Harika! Koca bir cümle!" → 'Her gün hızlı koşuyorum'
 * Cümlenin nasıl büyüdüğünü hem görür hem sesli üretir.
 */
import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../core/langState'
import { TARGET_LANGS } from '../core/languages'
import { useSpeech } from '../hooks/useSpeech'
import { checkAnswer } from '../utils/fuzzyMatch'
import { CHAINS } from '../data/patterns'
import { addXp } from '../core/progressStore'
import * as sfx from '../core/sfx'

const words = (s) => (s || '').trim().split(/\s+/).filter(Boolean)
const shuffle = (a) => [...a].sort(() => Math.random() - 0.5)
const PRAISE = ['Süper! 👏', 'Harika! ⭐', 'Çok iyi! 💪', 'Aferin! 🌟']
const rnd = (a) => a[Math.floor(Math.random() * a.length)]

export default function ChainMode() {
  const navigate = useNavigate()
  const [lang] = useLang()
  const { speak } = useSpeech(lang)

  const [ci, setCi]       = useState(0)
  const [step, setStep]   = useState(0)
  const [messages, setMessages] = useState([])
  const [picked, setPicked] = useState([])
  const [phase, setPhase]   = useState('intro') // intro | build | done
  const [wrong, setWrong]   = useState(false)
  const bottomRef = useRef(null)

  const chain = CHAINS[ci]
  const steps = chain ? (chain[lang] || chain.en) : []
  const target = steps[step] || ''
  const bank = useMemo(() => shuffle(words(target)), [target, ci, step])
  const built = picked.join(' ')

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const push = (m) => setMessages(prev => [...prev, m])

  const startChain = (idx) => {
    const c = CHAINS[idx]
    const st = c[lang] || c.en
    setCi(idx); setStep(0); setPicked([]); setWrong(false); setPhase('build')
    setMessages([
      { from: 'bot', text: `Hadi birlikte cümle büyütelim! 🔗 (${c.note})` },
      { from: 'bot', prompt: true, tr: (c.tr || [])[0], sub: null },
    ])
  }

  const start = () => startChain(0)

  const check = () => {
    const r = checkAnswer(built, target)
    if (!(r.match || r.score >= 0.85)) { sfx.wrong(); setWrong(true); return }
    // Doğru
    sfx.correct(); setWrong(false)
    push({ from: 'user', text: target })
    speak(target)
    if (step + 1 < steps.length) {
      push({ from: 'bot', text: `${rnd(PRAISE)} Şimdi biraz daha uzatalım! 🔗` })
      push({ from: 'bot', prompt: true, tr: chain.tr[step + 1], sub: `önce: "${steps[step]}"` })
      setStep(step + 1); setPicked([])
    } else {
      addXp(8)
      push({ from: 'bot', text: `🎉 Koca bir cümle kurdun: "${target}" — bir zinciri tamamladın!` })
      setPhase('done')
    }
  }

  const nextChain = () => {
    if (ci + 1 >= CHAINS.length) { sfx.reward(); setPhase('intro') }
    else startChain(ci + 1)
  }

  // ── Giriş ──
  if (phase === 'intro') {
    return (
      <div style={S.page}>
        <Header onBack={() => navigate('/learn-hub')} lang={lang} />
        <div style={{ ...S.body, alignItems: 'center', textAlign: 'center', paddingTop: 36 }}>
          <div style={{ fontSize: 60 }}>🔗</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Cümle Zinciri</div>
          <div style={{ fontSize: 15, color: '#64748B', maxWidth: 330, lineHeight: 1.6 }}>
            Bot seninle <b>sohbet ederek</b> cümleyi adım adım büyütür. Kısa bir
            cümleyle başlar, sen kurdukça uzar. Cümlelerin nasıl büyüdüğünü öğren! 🔗
          </div>
          <button onClick={start} style={{ ...S.primary, maxWidth: 280 }}>Başla ({CHAINS.length} zincir)</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...S.page, display: 'flex', flexDirection: 'column' }}>
      <Header onBack={() => setPhase('intro')} lang={lang} right={`${ci + 1}/${CHAINS.length}`} />

      {/* Sohbet */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', maxWidth: 600, width: '100%', margin: '0 auto' }}>
        {messages.map((m, i) => (
          <Bubble key={i} m={m} onSpeak={m.from === 'user' ? () => speak(m.text) : null} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Girdi alanı */}
      <div style={{ background: 'white', borderTop: '1px solid #E2E8F0', padding: '14px 18px 26px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          {phase === 'done' ? (
            <button onClick={nextChain} style={S.primary}>
              {ci + 1 >= CHAINS.length ? 'Bitir 🏁' : 'Sonraki Zincir →'}
            </button>
          ) : (
            <>
              <div style={{ ...S.builtBox, borderColor: wrong ? '#FCA5A5' : '#CBD5E1' }}>
                {picked.length === 0
                  ? <span style={{ color: '#CBD5E1' }}>Kelimelere dokun...</span>
                  : picked.map((w, i) => (
                      <span key={i} onClick={() => { setPicked(p => p.filter((_, j) => j !== i)); setWrong(false) }}
                            style={S.builtChip}>{w} ✕</span>
                    ))}
              </div>
              <div style={S.bankWrap}>
                {bank.map((w, i) => {
                  const used = picked.filter(p => p === w).length
                  const avail = bank.filter(b => b === w).length
                  const disabled = used >= avail
                  return (
                    <button key={i} disabled={disabled}
                      onClick={() => { setPicked(p => [...p, w]); setWrong(false) }}
                      style={{ ...S.bankChip, opacity: disabled ? 0.3 : 1 }}>{w}</button>
                  )
                })}
              </div>
              <button onClick={check} disabled={!picked.length}
                style={{ ...S.primary, opacity: picked.length ? 1 : 0.5, marginTop: 10 }}>
                {wrong ? 'Tekrar dene 🔁' : 'Kur ✓'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Bubble({ m, onSpeak }) {
  const bot = m.from === 'bot'
  return (
    <div style={{ display: 'flex', flexDirection: bot ? 'row' : 'row-reverse', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}>
      <div style={S.avatar}>{bot ? '🤖' : '🧒'}</div>
      <div style={{ maxWidth: '80%' }}>
        <div style={{
          background: bot ? '#F1F5F9' : '#DCFCE7',
          border: `1px solid ${bot ? '#E2E8F0' : '#BBF7D0'}`,
          borderRadius: bot ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
          padding: '11px 15px',
        }}>
          {m.prompt ? (
            <div>
              <span style={{ fontSize: 13, color: '#64748B' }}>Şu cümleyi kur:</span>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>“{m.tr}”</div>
              {m.sub && <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }}>{m.sub}</div>}
            </div>
          ) : (
            <span style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>{m.text}</span>
          )}
          {onSpeak && <button onClick={onSpeak} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 6 }}>🔊</button>}
        </div>
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
  avatar: { width: 32, height: 32, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 },
  builtBox: { minHeight: 50, background: '#F8FAFC', border: '1.5px dashed #CBD5E1', borderRadius: 12, padding: 10, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  builtChip: { background: '#EFF8FF', border: '1px solid #BAE6FD', color: '#0369A1', borderRadius: 8, padding: '6px 10px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  bankWrap: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  bankChip: { background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 13px', fontSize: 14, fontWeight: 600, color: '#334155', cursor: 'pointer' },
  primary: { height: 50, background: '#0891B2', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, color: 'white', cursor: 'pointer', width: '100%' },
}
