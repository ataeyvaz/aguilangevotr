/**
 * Reinforce.jsx — "🎯 Pekiştirme" modu
 *
 * Zorlanılan kelime VE cümleleri geriye dönük olarak toplar; her birini
 * ÖNCE öğretir (kart + örnek cümle + ses) SONRA soruyla pekiştirir.
 * Yanlışta tekrar öğretir → "tekrar tekrar hem öğret hem pekiştir".
 *
 * Kaynaklar (hepsi mevcut çekirdek):
 *   progressStore  → zorlanılan kelimeler (getLevel===1)
 *   sentenceStore  → zorlanılan cümleler (getSentenceReport.struggling)
 *   quizEngine     → mcq üretimi + değerlendirme
 *   wordSentence   → kelimeye örnek cümle
 *   SentenceMini   → cümleyi öğret + kur + kaydet (recordSentence)
 *
 * Seviye geçişlerinde de çağrılır (?src=level) → geriye dönük tekrar.
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { load as loadProgress, recordAnswer } from '../core/progressStore'
import { getSentenceReport } from '../core/sentenceStore'
import { loadUpToLevel, toCard } from '../core/contentStore'
import { getLang } from '../core/langState'
import { TARGET_LANGS } from '../core/languages'
import { makeSentenceForWord } from '../core/wordSentence'
import { buildQuestion, grade } from '../core/quizEngine'
import { useSpeech } from '../hooks/useSpeech'
import SentenceMini from '../components/SentenceMini'
import * as sfx from '../core/sfx'

const MAX_WORDS = 8
const MAX_SENTENCES = 6

function getLevel(correct, wrong) {
  if (correct >= 3 && correct > wrong) return 3
  if (correct >= 1 && correct > wrong) return 2
  return 1
}

// Zorlanılan kelime + cümleleri sırayla harmanla (w, s, w, s, ...)
function interleave(words, sentences) {
  const out = []
  const n = Math.max(words.length, sentences.length)
  for (let i = 0; i < n; i++) {
    if (words[i]) out.push({ kind: 'word', ...words[i] })
    if (sentences[i]) out.push({ kind: 'sentence', c: sentences[i] })
  }
  return out
}

export default function Reinforce() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const fromLevel = params.get('src') === 'level'
  const lang = getLang()
  const { speak } = useSpeech(lang)

  const [loading, setLoading] = useState(true)
  const [pool, setPool]       = useState([])   // tüm kartlar (distractor havuzu)
  const [items, setItems]     = useState([])   // oturum kuyruğu
  const [idx, setIdx]         = useState(0)

  // Kelime alt-fazı
  const [phase, setPhase]   = useState('teach') // 'teach' | 'quiz'
  const [question, setQuestion] = useState(null)
  const [picked, setPicked] = useState(null)
  const [result, setResult] = useState(null)
  const [done, setDone]     = useState(0)

  useEffect(() => {
    const lang0 = getLang()
    const prog = loadProgress().words
    loadUpToLevel('B2').then(all => {
      const cards = all.map(w => toCard(w, lang0))
      setPool(cards)
      const byId = Object.fromEntries(cards.map(c => [c.id, c]))

      // Zorlanılan kelimeler
      const hardWords = Object.entries(prog)
        .filter(([, s]) => getLevel(s.correct_count || 0, s.wrong_count || 0) === 1
                        && (s.wrong_count || 0) > 0)
        .sort((a, b) => (b[1].wrong_count || 0) - (a[1].wrong_count || 0))
        .map(([id]) => byId[id])
        .filter(Boolean)
        .slice(0, MAX_WORDS)
        .map(card => ({ card }))

      // Zorlanılan cümleler
      const hardSentences = getSentenceReport(lang0).struggling.slice(0, MAX_SENTENCES)

      setItems(interleave(hardWords, hardSentences))
      setLoading(false)
    })
  }, [])

  const item = items[idx]

  // Kelime öğret fazından örnek cümle
  const example = useMemo(
    () => item?.kind === 'word' ? makeSentenceForWord(item.card.raw, lang) : null,
    [item, lang]
  )

  // Öğret fazına girince kelimeyi seslendir
  useEffect(() => {
    if (item?.kind === 'word' && phase === 'teach') {
      const t = setTimeout(() => speak(item.card.target), 350)
      return () => clearTimeout(t)
    }
  }, [idx, phase]) // eslint-disable-line

  const startQuiz = () => {
    setQuestion(buildQuestion(item.card, pool, 'mcq'))
    setPicked(null); setResult(null)
    setPhase('quiz')
  }

  const answer = (opt) => {
    if (result) return
    setPicked(opt)
    const g = grade(question, opt)
    setResult(g)
    if (g.correct) { sfx.correct(); recordAnswer(item.card.id, true, 4) }
    else { sfx.wrong(); recordAnswer(item.card.id, false, 0) }
    speak(question.answer)
  }

  const reteach = () => { setPhase('teach'); setQuestion(null); setPicked(null); setResult(null) }

  const nextItem = () => {
    setDone(d => d + 1)
    if (idx + 1 >= items.length) { sfx.reward(); setIdx(items.length) } // bitiş
    else { setIdx(i => i + 1); setPhase('teach'); setQuestion(null); setPicked(null); setResult(null) }
  }

  // ── Yükleniyor ──
  if (loading) return (
    <div style={S.center}>
      <div style={{ fontSize: 40 }}>⏳</div>
      <div style={{ fontSize: 15, color: '#64748B' }}>Zorlandıkların toplanıyor...</div>
    </div>
  )

  // ── Hiç zorlanılan yok ──
  if (!items.length) return (
    <div style={S.page}>
      <Header onBack={() => navigate('/dashboard')} />
      <div style={{ ...S.body, alignItems: 'center', textAlign: 'center', paddingTop: 48 }}>
        <div style={{ fontSize: 60 }}>🎉</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Harika gidiyorsun!</div>
        <div style={{ fontSize: 15, color: '#64748B', maxWidth: 320, lineHeight: 1.6 }}>
          Şu an tekrar etmen gereken zor bir kelime veya cümle yok. Yeni kelimeler
          öğrenmeye devam et, zorlandıkların burada birikince pekiştiririz. 💪
        </div>
        <button onClick={() => navigate('/dashboard')} style={{ ...S.primary, maxWidth: 260 }}>
          Panele Dön →
        </button>
      </div>
    </div>
  )

  // ── Bitiş ──
  if (idx >= items.length) return (
    <div style={S.page}>
      <Header onBack={() => navigate('/dashboard')} />
      <div style={{ ...S.body, alignItems: 'center', textAlign: 'center', paddingTop: 48 }}>
        <div style={{ fontSize: 60 }}>🏆</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Pekiştirme tamamlandı!</div>
        <div style={{ fontSize: 15, color: '#64748B', maxWidth: 340, lineHeight: 1.6 }}>
          {done} zor öğeyi tekrar çalıştın. Doğru bildiklerin artık daha güçlü;
          hâlâ zorladıkların bir sonraki pekiştirmede yine karşına gelecek. 🔁
        </div>
        <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 320 }}>
          <button onClick={() => navigate('/report')} style={{ ...S.ghost, flex: 1 }}>📊 Rapor</button>
          <button onClick={() => navigate('/dashboard')} style={{ ...S.primary, flex: 1, marginTop: 0 }}>Bitir 🏁</button>
        </div>
      </div>
    </div>
  )

  const total = items.length

  return (
    <div style={S.page}>
      <Header onBack={() => navigate('/dashboard')} right={`${idx + 1}/${total}`} note={fromLevel ? 'Seviye tekrarı' : null} />
      <div style={S.body}>

        {item.kind === 'word' ? (
          <>
            {/* ── ÖĞRET ── */}
            {phase === 'teach' && (
              <>
                <div style={S.teachTag}>📖 Önce öğren</div>
                <div style={S.card}>
                  {item.card.emoji && (
                    <div style={S.emojiWrap}>{item.card.emoji}</div>
                  )}
                  <div style={S.word}>{item.card.target}</div>
                  {item.card.ipa && <div style={S.ipa}>/{item.card.ipa}/</div>}
                  <div style={S.trBox}>{item.card.source}</div>
                  <button onClick={() => speak(item.card.target)} style={S.listen}>🔊 Dinle</button>
                </div>

                {/* Örnek cümle */}
                {example && (
                  <div style={S.exampleBox}>
                    <div style={S.exampleHead}>💬 Örnek cümle</div>
                    <div style={S.exampleTarget}>{example.target}</div>
                    <div style={S.exampleTr}>“{example.tr}”</div>
                    <button onClick={() => speak(example.target)} style={S.miniListen}>🔊 Dinle</button>
                  </div>
                )}

                <button onClick={startQuiz} style={S.primary}>Pekiştir → </button>
              </>
            )}

            {/* ── PEKİŞTİR (quiz) ── */}
            {phase === 'quiz' && question && (
              <>
                <div style={S.quizTag}>🧠 Şimdi hatırla</div>
                <div style={S.qCard}>
                  {item.card.emoji && <div style={{ fontSize: 40 }}>{item.card.emoji}</div>}
                  <div style={S.qText}>{question.prompt}</div>
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {question.options.map((opt, i) => {
                    let st = { ...S.opt }
                    if (result) {
                      if (opt === question.answer) st = { ...st, ...S.optCorrect }
                      else if (opt === picked) st = { ...st, ...S.optWrong }
                    }
                    return (
                      <button key={i} disabled={!!result} onClick={() => answer(opt)} style={st}>{opt}</button>
                    )
                  })}
                </div>

                {result && (
                  <>
                    <div style={{ ...S.banner,
                      background: result.correct ? '#F0FDF4' : '#FEF2F2',
                      borderColor: result.correct ? '#BBF7D0' : '#FECACA',
                      color: result.correct ? '#15803D' : '#B91C1C' }}>
                      {result.correct ? '✅ Doğru! Güçleniyor.' : `❌ Doğrusu: ${question.answer}`}
                      <button onClick={() => speak(question.answer)} style={S.mini}>🔊</button>
                    </div>
                    {result.correct
                      ? <button onClick={nextItem} style={S.primary}>{idx + 1 >= total ? 'Bitir 🏁' : 'Devam →'}</button>
                      : <div style={{ display: 'flex', gap: 10 }}>
                          <button onClick={reteach} style={{ ...S.ghost, flex: 1, marginTop: 8 }}>🔁 Tekrar öğren</button>
                          <button onClick={nextItem} style={{ ...S.primary, flex: 1 }}>Geç →</button>
                        </div>}
                  </>
                )}
              </>
            )}
          </>
        ) : (
          /* ── CÜMLE pekiştirme (SentenceMini öğretir + kaydeder) ── */
          <>
            <div style={S.teachTag}>💬 Zorlandığın cümle</div>
            <SentenceMini tr={item.c.tr} target={item.c.target} lang={lang} fn={item.c.fn} />
            <button onClick={nextItem} style={S.primary}>{idx + 1 >= total ? 'Bitir 🏁' : 'Devam →'}</button>
          </>
        )}
      </div>
    </div>
  )
}

function Header({ onBack, right, note }) {
  return (
    <div style={S.header}>
      <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={S.back}>←</button>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
          🎯 Pekiştirme {note && <span style={{ color: '#94A3B8', fontWeight: 500 }}>· {note}</span>}
        </div>
        {right && <div style={S.counter}>{right}</div>}
      </div>
    </div>
  )
}

const S = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  center: { minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'Inter, sans-serif' },
  header: { background: 'white', borderBottom: '1px solid #E2E8F0', padding: '12px 18px', position: 'sticky', top: 0, zIndex: 10 },
  back: { background: '#F1F5F9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16 },
  counter: { background: '#EFF8FF', borderRadius: 8, padding: '4px 12px', fontSize: 13, fontWeight: 700, color: '#0891B2' },
  body: { maxWidth: 560, margin: '0 auto', padding: '20px 24px 48px', display: 'flex', flexDirection: 'column', gap: 14 },
  teachTag: { fontSize: 12, fontWeight: 800, color: '#0891B2', letterSpacing: .3 },
  quizTag: { fontSize: 12, fontWeight: 800, color: '#7C3AED', letterSpacing: .3 },
  card: { background: 'white', border: '1px solid #E2E8F0', borderRadius: 20, padding: '32px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  emojiWrap: { width: 90, height: 90, borderRadius: '50%', background: '#EFF8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 },
  word: { fontSize: 34, fontWeight: 800, color: '#0F172A' },
  ipa: { fontSize: 15, color: '#94A3B8', fontFamily: 'serif' },
  trBox: { background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '8px 20px', fontSize: 20, fontWeight: 800, color: '#15803D' },
  listen: { background: '#EFF8FF', border: '1.5px solid #BAE6FD', color: '#0891B2', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 4 },
  exampleBox: { background: '#FBFCFD', border: '1px solid #E2E8F0', borderRadius: 14, padding: 14, textAlign: 'center' },
  exampleHead: { fontSize: 12, fontWeight: 800, color: '#0891B2', marginBottom: 8 },
  exampleTarget: { fontSize: 18, fontWeight: 800, color: '#0F172A' },
  exampleTr: { fontSize: 14, color: '#64748B', marginTop: 4 },
  miniListen: { background: 'white', border: '1px solid #CBD5E1', color: '#334155', borderRadius: 9999, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 10 },
  qCard: { background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: '26px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  qText: { fontSize: 24, fontWeight: 800, color: '#0F172A' },
  opt: { background: 'white', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '15px 18px', fontSize: 16, fontWeight: 600, color: '#0F172A', cursor: 'pointer', textAlign: 'left' },
  optCorrect: { borderColor: '#16A34A', background: '#F0FDF4', color: '#15803D' },
  optWrong: { borderColor: '#DC2626', background: '#FEF2F2', color: '#B91C1C' },
  banner: { border: '1px solid', borderRadius: 12, padding: '14px 16px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 },
  mini: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 },
  primary: { height: 52, background: '#0891B2', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, color: 'white', cursor: 'pointer', marginTop: 8, width: '100%' },
  ghost: { height: 52, background: '#F1F5F9', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, color: '#475569', cursor: 'pointer' },
}
