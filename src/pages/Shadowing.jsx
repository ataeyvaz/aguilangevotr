/**
 * Shadowing.jsx — "Söyle & Tekrarla" akıcılık modu
 *
 * Cümleyi dinle → mikrofona tekrarla → telaffuz puanı al.
 * Taklit (shadowing) yoluyla akıcı konuşma ve doğru telaffuz geliştirir.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../core/langState'
import { TARGET_LANGS } from '../core/languages'
import { useSpeech } from '../hooks/useSpeech'
import { getPronunciationScore } from '../utils/fuzzyMatch'
import { collectSentences } from '../data/sentenceBank'
import { addXp } from '../core/progressStore'
import * as sfx from '../core/sfx'

const shuffle = (a) => [...a].sort(() => Math.random() - 0.5)

export default function Shadowing() {
  const navigate = useNavigate()
  const [lang] = useLang()
  const { speak, startListening, stopListening, isListening, transcript, sttSupported } = useSpeech(lang)

  const [pool, setPool]   = useState([])
  const [loading, setLoading] = useState(true)
  const [queue, setQueue] = useState([])
  const [qi, setQi]       = useState(0)
  const [result, setResult] = useState(null)
  const [score, setScore]   = useState(0)
  const [heard, setHeard]   = useState('')

  useEffect(() => {
    let alive = true
    setLoading(true)
    collectSentences(lang, { maxW: 9 }).then(s => { if (alive) { setPool(s); setLoading(false) } })
    return () => { alive = false }
  }, [lang])

  const item = queue[qi]

  const start = () => {
    setQueue(shuffle(pool).slice(0, 10)); setQi(0); setResult(null); setScore(0); setHeard('')
  }

  // Yeni cümlede otomatik seslendir
  useEffect(() => {
    if (item) { setResult(null); setHeard(''); const t = setTimeout(() => speak(item.target), 400); return () => clearTimeout(t) }
  }, [qi, item]) // eslint-disable-line

  // Konuşma bitince değerlendir
  useEffect(() => {
    if (!transcript || isListening || !item || result) return
    const r = getPronunciationScore(transcript, item.target)
    setHeard(transcript)
    setResult(r)
    if (r.score >= 55) { sfx.correct(); setScore(s => s + 1); addXp(5); }
    else sfx.wrong()
  }, [transcript, isListening]) // eslint-disable-line

  const next = () => {
    if (qi + 1 >= queue.length) { sfx.reward(); setQueue([]) }
    else setQi(i => i + 1)
  }

  // ── Başlangıç / bitiş ──
  if (!queue.length) {
    const done = score > 0
    return (
      <div style={S.page}>
        <Header onBack={() => navigate('/learn-hub')} lang={lang} />
        <div style={{ ...S.body, alignItems: 'center', textAlign: 'center', paddingTop: 36 }}>
          <div style={{ fontSize: 60 }}>🗣️</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Söyle & Tekrarla</div>
          <div style={{ fontSize: 15, color: '#64748B', maxWidth: 320, lineHeight: 1.6 }}>
            Cümleyi dinle, sonra mikrofona aynısını söyle. Taklit ederek
            akıcı konuşmayı ve doğru telaffuzu geliştir! 🎤
          </div>
          {!sttSupported && (
            <div style={{ ...S.banner, background: '#FEF3C7', borderColor: '#FDE68A', color: '#92400E' }}>
              ⚠️ Bu cihazda mikrofon desteklenmiyor
            </div>
          )}
          {done && (
            <div style={{ ...S.banner, background: '#F0FDF4', borderColor: '#BBF7D0', color: '#15803D' }}>
              🎉 Bitti! {score}/10 iyi telaffuz
            </div>
          )}
          <button onClick={start} disabled={loading || !pool.length || !sttSupported}
            style={{ ...S.primary, opacity: loading || !pool.length || !sttSupported ? 0.5 : 1, maxWidth: 280 }}>
            {loading ? 'Yükleniyor...' : done ? 'Yeni Tur' : `Başla (${pool.length} cümle)`}
          </button>
        </div>
      </div>
    )
  }

  const lvl = result ? (result.score >= 80 ? { t: `🎉 Mükemmel! %${result.score}`, c: '#15803D', bg: '#F0FDF4', bd: '#BBF7D0' }
                     : result.score >= 55 ? { t: `👍 Güzel! %${result.score}`, c: '#0369A1', bg: '#EFF8FF', bd: '#BAE6FD' }
                     : { t: `🙂 Az kaldı! %${result.score}`, c: '#92400E', bg: '#FEF3C7', bd: '#FDE68A' }) : null

  return (
    <div style={S.page}>
      <Header onBack={() => setQueue([])} lang={lang} right={`${qi + 1}/${queue.length}`} />
      <div style={S.body}>
        <div style={S.card}>
          <button onClick={() => speak(item.target)} style={S.playBtn}>🔊 Dinle</button>
          <div style={S.target}>{item.target}</div>
          <div style={S.tr}>{item.tr}</div>
        </div>

        {sttSupported && (
          <button onClick={() => isListening ? stopListening() : startListening()} disabled={!!result}
            style={{ ...S.primary, background: isListening ? '#DC2626' : '#0891B2', opacity: result ? 0.5 : 1 }}>
            {isListening ? '🔴 Dinliyorum...' : '🎤 Tekrarla'}
          </button>
        )}

        {heard && <div style={S.heard}>Duyduğum: "{heard}"</div>}

        {result && (
          <>
            <div style={{ ...S.banner, background: lvl.bg, borderColor: lvl.bd, color: lvl.c }}>
              {lvl.t}{result.score >= 55 ? ' · +5 XP' : ''}
              <button onClick={() => speak(item.target)} style={S.miniPlay}>🔊</button>
            </div>
            <button onClick={next} style={S.primary}>
              {qi + 1 >= queue.length ? 'Bitir 🏁' : 'Sıradaki →'}
            </button>
          </>
        )}
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
          🗣️ Söyle & Tekrarla <span style={{ color: '#94A3B8', fontWeight: 500 }}>· {TARGET_LANGS[lang]?.flag}</span>
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
  body: { maxWidth: 560, margin: '0 auto', padding: '22px 24px 48px', display: 'flex', flexDirection: 'column', gap: 14 },
  card: { background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  playBtn: { background: '#EFF8FF', border: '1.5px solid #BAE6FD', color: '#0891B2', borderRadius: 12, padding: '10px 22px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  target: { fontSize: 22, fontWeight: 800, color: '#0F172A' },
  tr: { fontSize: 14, color: '#94A3B8' },
  heard: { fontSize: 13, color: '#64748B', fontStyle: 'italic', textAlign: 'center' },
  primary: { height: 52, background: '#0891B2', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, color: 'white', cursor: 'pointer', marginTop: 4, width: '100%' },
  banner: { border: '1px solid', borderRadius: 12, padding: '14px 16px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 },
  miniPlay: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 },
}
