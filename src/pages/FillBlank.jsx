/**
 * FillBlank.jsx — "Boşluk Doldur" akıcılık modu
 *
 * Cümlede eksik bir kelimeyi bağlamdan bul. Cümleyi bütün olarak
 * anlamayı ve doğru kelimeyi yerinde kullanmayı geliştirir.
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../core/langState'
import { TARGET_LANGS } from '../core/languages'
import { useSpeech } from '../hooks/useSpeech'
import { collectSentences } from '../data/sentenceBank'
import { addXp } from '../core/progressStore'
import * as sfx from '../core/sfx'

const clean = (w) => w.replace(/[.,!?;:¡¿"]/g, '')
const shuffle = (a) => [...a].sort(() => Math.random() - 0.5)

export default function FillBlank() {
  const navigate = useNavigate()
  const [lang] = useLang()
  const { speak } = useSpeech(lang)

  const [pool, setPool]   = useState([])
  const [loading, setLoading] = useState(true)
  const [queue, setQueue] = useState([])
  const [qi, setQi]       = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore]   = useState(0)

  // Tüm kelime havuzu (yanıltıcılar için)
  const allWords = useMemo(() => {
    const set = new Set()
    pool.forEach(s => s.target.split(/\s+/).forEach(w => { const c = clean(w); if (c.length > 1) set.add(c) }))
    return [...set]
  }, [pool])

  useEffect(() => {
    let alive = true
    setLoading(true)
    collectSentences(lang, { minW: 3, maxW: 9 }).then(s => { if (alive) { setPool(s); setLoading(false) } })
    return () => { alive = false }
  }, [lang])

  // Soru üret: bir kelimeyi boşlukla, seçenekler oluştur
  const buildQuestion = (s) => {
    const parts = s.target.split(/\s+/)
    // İlk kelime dışında, harften oluşan bir kelime seç
    const idxs = parts.map((w, i) => i).filter(i => i > 0 && clean(parts[i]).length > 1)
    const bi = idxs[Math.floor(Math.random() * idxs.length)] ?? parts.length - 1
    const answer = clean(parts[bi])
    const distractors = shuffle(allWords.filter(w => w.toLowerCase() !== answer.toLowerCase())).slice(0, 3)
    const options = shuffle([answer, ...distractors])
    const display = parts.map((w, i) => i === bi ? '____' : w).join(' ')
    return { tr: s.tr, full: s.target, display, answer, options }
  }

  const start = () => {
    const qs = shuffle(pool).slice(0, 10).map(buildQuestion)
    setQueue(qs); setQi(0); setPicked(null); setScore(0)
  }

  const q = queue[qi]

  const pick = (opt) => {
    if (picked) return
    setPicked(opt)
    const ok = opt.toLowerCase() === q.answer.toLowerCase()
    if (ok) { sfx.correct(); setScore(s => s + 1); addXp(4); setTimeout(() => speak(q.full), 250) }
    else sfx.wrong()
  }

  const next = () => {
    if (qi + 1 >= queue.length) { sfx.reward(); setQueue([]) }
    else { setQi(i => i + 1); setPicked(null) }
  }

  if (!queue.length) {
    const done = score > 0
    return (
      <div style={S.page}>
        <Header onBack={() => navigate('/learn-hub')} lang={lang} />
        <div style={{ ...S.body, alignItems: 'center', textAlign: 'center', paddingTop: 36 }}>
          <div style={{ fontSize: 60 }}>✏️</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Boşluk Doldur</div>
          <div style={{ fontSize: 15, color: '#64748B', maxWidth: 320, lineHeight: 1.6 }}>
            Cümledeki eksik kelimeyi bağlamdan bul. Doğru kelimeyi yerinde
            kullanmayı öğren! 🧠
          </div>
          {done && (
            <div style={{ ...S.banner, background: '#F0FDF4', borderColor: '#BBF7D0', color: '#15803D' }}>
              🎉 Bitti! {score}/10 doğru
            </div>
          )}
          <button onClick={start} disabled={loading || pool.length < 4}
            style={{ ...S.primary, opacity: loading || pool.length < 4 ? 0.5 : 1, maxWidth: 280 }}>
            {loading ? 'Yükleniyor...' : done ? 'Yeni Tur' : `Başla (${pool.length} cümle)`}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      <Header onBack={() => setQueue([])} lang={lang} right={`${qi + 1}/${queue.length}`} />
      <div style={S.body}>
        <div style={S.card}>
          <div style={S.trLabel}>{q.tr}</div>
          <div style={S.sentence}>{q.display}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {q.options.map((opt, i) => {
            let st = { ...S.opt }
            if (picked) {
              if (opt.toLowerCase() === q.answer.toLowerCase()) st = { ...st, ...S.correct }
              else if (opt === picked) st = { ...st, ...S.wrong }
            }
            return <button key={i} disabled={!!picked} onClick={() => pick(opt)} style={st}>{opt}</button>
          })}
        </div>
        {picked && (
          <>
            <div style={{ ...S.banner,
              background: picked.toLowerCase() === q.answer.toLowerCase() ? '#F0FDF4' : '#FEF2F2',
              borderColor: picked.toLowerCase() === q.answer.toLowerCase() ? '#BBF7D0' : '#FECACA',
              color: picked.toLowerCase() === q.answer.toLowerCase() ? '#15803D' : '#B91C1C' }}>
              {picked.toLowerCase() === q.answer.toLowerCase() ? '✅ Doğru! +4 XP' : `❌ Doğrusu: ${q.answer}`}
              <button onClick={() => speak(q.full)} style={S.miniPlay}>🔊</button>
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
          ✏️ Boşluk Doldur <span style={{ color: '#94A3B8', fontWeight: 500 }}>· {TARGET_LANGS[lang]?.flag}</span>
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
  card: { background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: 24, textAlign: 'center' },
  trLabel: { fontSize: 13, color: '#94A3B8', marginBottom: 10 },
  sentence: { fontSize: 22, fontWeight: 800, color: '#0F172A', lineHeight: 1.4 },
  opt: { background: 'white', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 700, color: '#0F172A', cursor: 'pointer' },
  correct: { borderColor: '#16A34A', background: '#F0FDF4', color: '#15803D' },
  wrong: { borderColor: '#DC2626', background: '#FEF2F2', color: '#B91C1C' },
  primary: { height: 52, background: '#0891B2', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, color: 'white', cursor: 'pointer', marginTop: 4, width: '100%' },
  banner: { border: '1px solid', borderRadius: 12, padding: '14px 16px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 },
  miniPlay: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 },
}
