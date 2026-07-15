/**
 * SentenceBuilder.jsx — "Cümle Kur" akıcılık modu
 *
 * Karışık kelimeleri doğru sıraya dizerek cümle kurma. Kaynak:
 * diyalog replikleri + senaryo cümleleri (tekrar tekrar oynanabilir).
 * Amaç: cümle yapısını elleriyle içselleştirmek + sesli duymak.
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../core/langState'
import { TARGET_LANGS } from '../core/languages'
import { useSpeech } from '../hooks/useSpeech'
import { checkAnswer } from '../utils/fuzzyMatch'
import { addXp } from '../core/progressStore'
import * as sfx from '../core/sfx'

const dialogueMods = import.meta.glob('../data/dialogues/*.json')
const scenarioMods = import.meta.glob('../data/scenarios/*.json')

const words = (s) => (s || '').trim().split(/\s+/).filter(Boolean)

// Cümleleri diyalog + senaryolardan topla (aktif dil için)
async function collectSentences(lang) {
  const out = []
  const push = (tr, target) => {
    if (!tr || !target) return
    const w = words(target)
    if (w.length < 2 || w.length > 8) return   // çocuk için 2–8 kelime
    out.push({ tr, target })
  }

  const dlgs = await Promise.all(Object.values(dialogueMods).map(fn => fn()))
  for (const m of dlgs) {
    for (const line of (m.default?.lines || [])) push(line.tr, line[lang])
  }
  const scns = await Promise.all(Object.values(scenarioMods).map(fn => fn()))
  for (const m of scns) {
    const s = m.default
    for (const ex of (s?.teach || [])) push(ex.tr, ex[lang])
    for (const qa of (s?.qa || [])) {
      push(qa.prompt?.tr, qa.prompt?.[lang])
      push(qa.answer?.tr, qa.answer?.[lang])
    }
  }
  // benzersiz (hedefe göre)
  const seen = new Set()
  return out.filter(s => { const k = s.target.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true })
}

const shuffle = (a) => [...a].sort(() => Math.random() - 0.5)

export default function SentenceBuilder() {
  const navigate = useNavigate()
  const [lang] = useLang()
  const { speak } = useSpeech(lang)

  const [pool, setPool]   = useState([])
  const [loading, setLoading] = useState(true)
  const [queue, setQueue] = useState([])
  const [qi, setQi]       = useState(0)
  const [picked, setPicked] = useState([])
  const [result, setResult] = useState(null)
  const [score, setScore]   = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true)
    collectSentences(lang).then(s => { if (alive) { setPool(s); setLoading(false) } })
    return () => { alive = false }
  }, [lang])

  const startRound = () => {
    const q = shuffle(pool).slice(0, 10)
    setQueue(q); setQi(0); setPicked([]); setResult(null); setScore(0)
  }

  const item = queue[qi]
  const bank = useMemo(() => item ? shuffle(words(item.target)) : [], [item])

  const built = picked.join(' ')

  const check = () => {
    if (!item || result) return
    const r = checkAnswer(built, item.target)
    const ok = r.match || r.score >= 0.85
    setResult({ ok, target: item.target })
    if (ok) { sfx.correct(); setScore(s => s + 1); addXp(5); setTimeout(() => speak(item.target), 250) }
    else sfx.wrong()
  }

  const next = () => {
    if (qi + 1 >= queue.length) { sfx.reward(); setQueue([]) }
    else { setQi(i => i + 1); setPicked([]); setResult(null) }
  }

  // ── Başlangıç / bitiş ekranı ──
  if (!queue.length) {
    const done = score > 0
    return (
      <div style={S.page}>
        <Header onBack={() => navigate('/learn-hub')} lang={lang} />
        <div style={{ ...S.body, alignItems: 'center', textAlign: 'center', paddingTop: 36 }}>
          <div style={{ fontSize: 60 }}>🧩</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Cümle Kur</div>
          <div style={{ fontSize: 15, color: '#64748B', maxWidth: 320, lineHeight: 1.6 }}>
            Karışık kelimeleri doğru sıraya diz, cümleyi kur ve sesini dinle.
            Cümle kurmak akıcı konuşmanın anahtarıdır! 💬
          </div>
          {done && (
            <div style={{ ...S.banner, background: '#F0FDF4', borderColor: '#BBF7D0', color: '#15803D' }}>
              🎉 Bitti! {score}/10 doğru cümle
            </div>
          )}
          <button onClick={startRound} disabled={loading || pool.length === 0}
            style={{ ...S.primary, opacity: loading || !pool.length ? 0.5 : 1, maxWidth: 280 }}>
            {loading ? 'Yükleniyor...' : done ? 'Yeni Tur' : `Başla (${pool.length} cümle)`}
          </button>
        </div>
      </div>
    )
  }

  // ── Oyun ekranı ──
  return (
    <div style={S.page}>
      <Header onBack={() => setQueue([])} lang={lang} right={`${qi + 1}/${queue.length}`} />
      <div style={S.body}>
        <div style={S.trCard}>
          <div style={S.trLabel}>ŞU CÜMLEYİ KUR</div>
          <div style={S.trText}>{item.tr}</div>
        </div>

        {/* Kurulan cümle */}
        <div style={S.builtBox}>
          {picked.length === 0
            ? <span style={{ color: '#CBD5E1' }}>Kelimelere dokun...</span>
            : picked.map((w, i) => (
                <span key={i} onClick={() => !result && setPicked(p => p.filter((_, j) => j !== i))} style={S.builtChip}>
                  {w}{!result && ' ✕'}
                </span>
              ))}
        </div>

        {/* Kelime bankası */}
        {!result && (
          <div style={S.bankWrap}>
            {bank.map((w, i) => {
              const used = picked.filter(p => p === w).length
              const avail = bank.filter(b => b === w).length
              const disabled = used >= avail
              return (
                <button key={i} disabled={disabled}
                  onClick={() => setPicked(p => [...p, w])}
                  style={{ ...S.bankChip, opacity: disabled ? 0.3 : 1 }}>{w}</button>
              )
            })}
          </div>
        )}

        {!result ? (
          <button onClick={check} disabled={!picked.length}
            style={{ ...S.primary, opacity: picked.length ? 1 : 0.5 }}>Kontrol Et ✓</button>
        ) : (
          <>
            <div style={{ ...S.banner,
              background: result.ok ? '#F0FDF4' : '#FEF3C7',
              borderColor: result.ok ? '#BBF7D0' : '#FDE68A',
              color: result.ok ? '#15803D' : '#92400E' }}>
              {result.ok ? '🎉 Doğru cümle! +5 XP' : `👍 Doğrusu: "${result.target}"`}
              <button onClick={() => speak(result.target)} style={S.miniPlay}>🔊</button>
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
          🧩 Cümle Kur <span style={{ color: '#94A3B8', fontWeight: 500 }}>· {TARGET_LANGS[lang]?.flag}</span>
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
  trCard: { background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: 20, textAlign: 'center' },
  trLabel: { fontSize: 11, fontWeight: 800, color: '#CBD5E1', letterSpacing: 1 },
  trText: { fontSize: 20, fontWeight: 800, color: '#0F172A', marginTop: 6 },
  builtBox: { minHeight: 56, background: 'white', border: '1.5px dashed #CBD5E1', borderRadius: 12, padding: 12, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  builtChip: { background: '#EFF8FF', border: '1px solid #BAE6FD', color: '#0369A1', borderRadius: 8, padding: '7px 12px', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  bankWrap: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  bankChip: { background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 14px', fontSize: 15, fontWeight: 600, color: '#334155', cursor: 'pointer' },
  primary: { height: 52, background: '#0891B2', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, color: 'white', cursor: 'pointer', marginTop: 4, width: '100%' },
  banner: { border: '1px solid', borderRadius: 12, padding: '14px 16px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 },
  miniPlay: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 },
}
