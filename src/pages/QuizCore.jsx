/**
 * QuizCore.jsx — Birleşik quiz ekranı (Faz C · çekirdek demosu)
 *
 * Tüm yeni altyapıyı uçtan uca kullanır:
 *   contentStore  → kelimeler (A1–C2)
 *   langState     → aktif hedef dil
 *   quizEngine    → mcq / written / audio üretimi
 *   progressStore → SM-2 + XP kaydı
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWords, availableLevels } from '../core/contentStore'
import { useLang } from '../core/langState'
import { TARGET_LANGS } from '../core/languages'
import { buildQuiz, grade, QUIZ_MODES } from '../core/quizEngine'
import { getDue, recordAnswer, recordQuizDone } from '../core/progressStore'
import { useSpeech } from '../hooks/useSpeech'
import * as sfx from '../core/sfx'

const CAT_LABELS = {
  all: 'Tümü', food: 'Yiyecek', animals: 'Hayvanlar', colors: 'Renkler', numbers: 'Sayılar',
  family: 'Aile', body: 'Vücut', home: 'Ev', transport: 'Ulaşım', fruits: 'Meyveler',
  school: 'Okul', clothing: 'Kıyafet', greetings: 'Selamlaşma', questions: 'Sorular',
  vegetables: 'Sebzeler', time: 'Zaman', jobs: 'Meslekler', sports: 'Spor',
  places: 'Yerler', adjectives: 'Sıfatlar', verbs: 'Fiiller',
  feelings: 'Duygular', health: 'Sağlık', travel: 'Seyahat', phrases: 'İfadeler',
}
const label = (c) => CAT_LABELS[c] || c

export default function QuizCore() {
  const navigate = useNavigate()
  const [lang] = useLang()
  const [level, setLevel]       = useState('A1')
  const [category, setCategory] = useState('all')
  const [modes, setModes]       = useState(['mcq'])
  const [started, setStarted]   = useState(false)
  const levels = availableLevels()

  // Rapor'dan gelen tekrar-testi: tüm seviyeleri kapsasın diye en üst seviyeyi yükle
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('aguilang_review_ids') || 'null')
      if (Array.isArray(raw) && raw.length && levels.length) setLevel(levels[levels.length - 1])
    } catch { /* yoksay */ }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const { cards, loading, categories } = useWords({ maxLevel: level, category, lang })
  const allCards = useWords({ maxLevel: level, lang }).cards   // distractor havuzu

  const { speak } = useSpeech(lang)

  // ── Quiz oturumu ──
  const [questions, setQuestions] = useState([])
  const [qi, setQi]         = useState(0)
  const [picked, setPicked] = useState(null)
  const [typed, setTyped]   = useState('')
  const [result, setResult] = useState(null)
  const [score, setScore]   = useState(0)

  const start = () => {
    // Rapor sayfasından "zorlandığım kelimelerden test" → tek seferlik odak
    let focus = null
    try {
      const raw = JSON.parse(localStorage.getItem('aguilang_review_ids') || 'null')
      if (Array.isArray(raw) && raw.length) {
        const ids = new Set(raw)
        focus = allCards.filter(c => ids.has(c.id))
      }
    } catch { /* yoksay */ }
    localStorage.removeItem('aguilang_review_ids')

    const due = getDue(cards, 10)
    const base = focus && focus.length ? focus : (due.length ? due : cards)
    const qs = buildQuiz(base, { modes, pool: allCards, count: 10 })
    setQuestions(qs); setQi(0); setScore(0)
    setPicked(null); setTyped(''); setResult(null)
    setStarted(true)
  }

  const q = questions[qi]

  // Sesli modda otomatik seslendir
  useEffect(() => {
    if (started && q && (q.mode === 'audio' || q.autoPlay)) {
      const t = setTimeout(() => speak(q.audioText), 400)
      return () => clearTimeout(t)
    }
  }, [qi, started]) // eslint-disable-line

  const submit = (given) => {
    if (result) return
    const g = grade(q, given)
    setResult(g)
    if (g.correct) { setScore(s => s + 1); sfx.correct() } else sfx.wrong()
    recordAnswer(q.id, g.correct, g.correct ? 4 : 0)
  }

  const next = () => {
    if (qi + 1 >= questions.length) {
      sfx.reward()
      recordQuizDone(score >= questions.length)   // tam puan → perfect
      setStarted(false); setQuestions([])
    }
    else { setQi(i => i + 1); setPicked(null); setTyped(''); setResult(null) }
  }

  // ════════ SETUP ekranı ════════
  if (!started) {
    const done = questions.length === 0 && score > 0
    const lastScore = score
    return (
      <div style={S.page}>
        <div style={S.header}>
          <button onClick={() => navigate('/dashboard')} style={S.back}>←</button>
          <div style={S.title}>🧠 Quiz — {TARGET_LANGS[lang].flag} {TARGET_LANGS[lang].label}</div>
        </div>
        <div style={S.body}>
          {done && (
            <div style={{ ...S.banner, background: '#F0FDF4', borderColor: '#BBF7D0', color: '#15803D' }}>
              🎉 Bitti! Skor: {lastScore}/10
            </div>
          )}

          {levels.length > 1 && (
            <>
              <div style={S.label}>Seviye</div>
              <div style={S.chipWrap}>
                {levels.map(lv => (
                  <button key={lv} onClick={() => { setLevel(lv); setCategory('all') }}
                    style={{ ...S.chip, ...(level === lv ? S.chipOn : {}) }}>{lv}</button>
                ))}
              </div>
            </>
          )}

          <div style={S.label}>Kategori</div>
          <div style={S.chipWrap}>
            {['all', ...categories.map(c => c.id)].map(c => (
              <button key={c} onClick={() => setCategory(c)}
                style={{ ...S.chip, ...(category === c ? S.chipOn : {}) }}>
                {label(c)}
              </button>
            ))}
          </div>

          <div style={S.label}>Mod (birden çok seçilebilir)</div>
          <div style={S.chipWrap}>
            {Object.values(QUIZ_MODES).map(m => {
              const on = modes.includes(m.id)
              return (
                <button key={m.id}
                  onClick={() => setModes(prev => on
                    ? (prev.length > 1 ? prev.filter(x => x !== m.id) : prev)
                    : [...prev, m.id])}
                  style={{ ...S.chip, ...(on ? S.chipOn : {}) }}>
                  {m.emoji} {m.label}
                </button>
              )
            })}
          </div>

          <button onClick={start} disabled={loading || !cards.length} style={{ ...S.primary, opacity: loading || !cards.length ? 0.5 : 1 }}>
            {loading ? 'Yükleniyor...' : `Başla (${cards.length} kelime)`}
          </button>
        </div>
      </div>
    )
  }

  // ════════ QUIZ ekranı ════════
  if (!q) return null
  const isWritten = q.mode === 'written'

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button onClick={() => { setStarted(false); setQuestions([]) }} style={S.back}>←</button>
        <div style={S.title}>{QUIZ_MODES[q.mode].emoji} {QUIZ_MODES[q.mode].label}</div>
        <div style={S.counter}>{qi + 1}/{questions.length}</div>
      </div>

      <div style={S.body}>
        {/* Soru */}
        <div style={S.qCard}>
          {q.emoji && q.mode !== 'audio' && <div style={{ fontSize: 44 }}>{q.emoji}</div>}
          {q.mode === 'audio'
            ? <button onClick={() => speak(q.audioText)} style={S.playBtn}>🔊 Tekrar Dinle</button>
            : <div style={S.qText}>{q.prompt}</div>}
          {q.mode !== 'audio' && q.ipa && <div style={S.ipa}>/{q.ipa}/</div>}
        </div>

        {/* Cevap alanı */}
        {isWritten ? (
          <>
            <input autoFocus value={typed} disabled={!!result}
              onChange={e => setTyped(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit(typed)}
              placeholder="Cevabını yaz..." style={S.input} />
            {!result && <button onClick={() => submit(typed)} disabled={!typed.trim()} style={{ ...S.primary, opacity: typed.trim() ? 1 : 0.5 }}>Kontrol Et</button>}
          </>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {q.options.map((opt, i) => {
              let st = { ...S.opt }
              if (result) {
                if (opt === q.answer) st = { ...st, ...S.optCorrect }
                else if (opt === picked) st = { ...st, ...S.optWrong }
              } else if (opt === picked) st = { ...st, ...S.optOn }
              return (
                <button key={i} disabled={!!result}
                  onClick={() => { setPicked(opt); submit(opt) }} style={st}>
                  {opt}
                </button>
              )
            })}
          </div>
        )}

        {/* Sonuç */}
        {result && (
          <>
            <div style={{ ...S.banner,
              background: result.correct ? '#F0FDF4' : '#FEF2F2',
              borderColor: result.correct ? '#BBF7D0' : '#FECACA',
              color: result.correct ? '#15803D' : '#B91C1C' }}>
              {result.correct ? '✅ Doğru!' : `❌ Doğrusu: ${q.answer}`}
              <button onClick={() => speak(q.answer)} style={S.miniPlay}>🔊</button>
            </div>
            <button onClick={next} style={S.primary}>
              {qi + 1 >= questions.length ? 'Bitir 🏁' : 'Devam →'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const S = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  header: { background: 'white', borderBottom: '1px solid #E2E8F0', padding: '12px 20px',
            position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: 12 },
  back: { background: '#F1F5F9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16 },
  title: { flex: 1, fontSize: 15, fontWeight: 700, color: '#0F172A' },
  counter: { background: '#EFF8FF', borderRadius: 8, padding: '4px 12px', fontSize: 13, fontWeight: 700, color: '#0891B2' },
  body: { maxWidth: 560, margin: '0 auto', padding: '22px 24px 48px', display: 'flex', flexDirection: 'column', gap: 14 },
  label: { fontSize: 12, fontWeight: 800, color: '#94A3B8', letterSpacing: .5, marginTop: 6 },
  chipWrap: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: { background: 'white', border: '1px solid #E2E8F0', borderRadius: 999, padding: '7px 14px',
          fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' },
  chipOn: { background: '#0891B2', borderColor: '#0891B2', color: 'white' },
  primary: { height: 52, background: '#0891B2', border: 'none', borderRadius: 12, fontSize: 15,
             fontWeight: 700, color: 'white', cursor: 'pointer', marginTop: 8 },
  qCard: { background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: '28px 20px',
           textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  qText: { fontSize: 24, fontWeight: 800, color: '#0F172A' },
  ipa: { fontSize: 14, color: '#94A3B8', fontFamily: 'serif' },
  playBtn: { background: '#EFF8FF', border: '1.5px solid #BAE6FD', color: '#0891B2', borderRadius: 12,
             padding: '12px 22px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  opt: { background: 'white', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '15px 18px',
         fontSize: 16, fontWeight: 600, color: '#0F172A', cursor: 'pointer', textAlign: 'left' },
  optOn: { borderColor: '#0891B2', background: '#EFF8FF' },
  optCorrect: { borderColor: '#16A34A', background: '#F0FDF4', color: '#15803D' },
  optWrong: { borderColor: '#DC2626', background: '#FEF2F2', color: '#B91C1C' },
  input: { height: 54, border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '0 16px',
           fontSize: 16, fontFamily: 'inherit', outline: 'none' },
  banner: { border: '1px solid', borderRadius: 12, padding: '14px 16px', fontSize: 15, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 },
  miniPlay: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 },
}
