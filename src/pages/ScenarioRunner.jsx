import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSpeech } from '../hooks/useSpeech'
import { checkAnswer, getPronunciationScore } from '../utils/fuzzyMatch'
import { useLang } from '../core/langState'
import { markScenarioDone } from '../core/progressStore'

const T = (obj, langId) => obj?.[langId] || obj?.en || ''

// ══════════════════════════════════════════════════════
export default function ScenarioRunner() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const scenarioId = params.get('id') || 'market'

  const [langId] = useLang()
  const lang = { id: langId }
  const { speak, stopSpeaking, isSpeaking,
          startListening, stopListening, isListening,
          transcript, sttSupported } = useSpeech(lang.id)

  const [data, setData]   = useState(null)
  const [stage, setStage] = useState('loading') // loading | teach | qa | generate | done

  // ── Senaryoyu yükle ──────────────────────────────────
  useEffect(() => {
    setStage('loading')
    import(`../data/scenarios/${scenarioId}.json`)
      .then(m => { setData(m.default); setStage('teach') })
      .catch(() => setStage('error'))
    return () => stopSpeaking()
  }, [scenarioId]) // eslint-disable-line

  if (stage === 'loading') return <Center emoji="⏳" text="Yükleniyor..." />
  if (stage === 'error' || !data) return <Center emoji="😕" text="Senaryo bulunamadı" />

  const back = () => { stopSpeaking(); navigate('/scenarios') }

  return (
    <div style={S.page}>
      <Header title={`${data.emoji} ${data.title}`} onBack={back} stage={stage} />
      {stage === 'teach' && (
        <TeachStage data={data} lang={lang} speak={speak} isSpeaking={isSpeaking}
                    onDone={() => setStage('qa')} />
      )}
      {stage === 'qa' && (
        <QAStage data={data} lang={lang}
                 speak={speak} isSpeaking={isSpeaking}
                 startListening={startListening} stopListening={stopListening}
                 isListening={isListening} transcript={transcript} sttSupported={sttSupported}
                 onDone={() => setStage('generate')} />
      )}
      {stage === 'generate' && (
        <GenerateStage data={data} lang={lang} speak={speak}
                       onDone={() => setStage('done')} />
      )}
      {stage === 'done' && <DoneStage data={data} onBack={back} />}
    </div>
  )
}

// ══════════════════════════════════════════════════════
// AŞAMA 1 — ÖRNEKLE ÖĞRETİM (dinle)
// ══════════════════════════════════════════════════════
function TeachStage({ data, lang, speak, isSpeaking, onDone }) {
  const pattern = T(data.pattern, lang.id)
  return (
    <div style={S.body}>
      <Badge>1. Öğren — Dinle ve tekrar et</Badge>

      <div style={S.patternCard}>
        <div style={S.patternLabel}>KALIP</div>
        <div style={S.patternText}>{pattern}</div>
        <div style={S.patternTr}>{T(data.pattern, 'tr')}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {data.teach.map((ex, i) => (
          <button key={i} onClick={() => speak(T(ex, lang.id))} style={S.exampleRow}>
            <span style={S.speakerIcon}>🔊</span>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={S.exampleTarget}>{T(ex, lang.id)}</div>
              <div style={S.exampleTr}>{T(ex, 'tr')}</div>
            </div>
          </button>
        ))}
      </div>

      <button onClick={onDone} disabled={isSpeaking} style={S.primaryBtn}>
        Alıştırmaya Geç →
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// AŞAMA 2 — SORU-CEVAP + ROL DEĞİŞİMİ (sesli)
// ══════════════════════════════════════════════════════
function QAStage({ data, lang, speak, isSpeaking, startListening, stopListening,
                   isListening, transcript, sttSupported, onDone }) {
  const [idx, setIdx]       = useState(0)
  const [result, setResult] = useState(null) // {score, level} | null
  const spokePromptRef = useRef(false)

  const item = data.qa[idx]
  const childAsks = item.childRole === 'ask'

  // Bot repliğini seslendir: cevap turunda soruyu, soru turunda (çocuk sorduktan sonra) cevabı
  useEffect(() => {
    setResult(null)
    spokePromptRef.current = false
    if (!childAsks) {
      const t = setTimeout(() => speak(T(item.prompt, lang.id)), 400)
      return () => clearTimeout(t)
    }
  }, [idx]) // eslint-disable-line

  // Hedef metin: çocuk soruyorsa prompt'u söylemeli, cevaplıyorsa answer'ı söylemeli
  const target   = childAsks ? T(item.prompt, lang.id) : T(item.answer, lang.id)
  const altList  = (childAsks ? item.prompt.alts?.[lang.id] : item.answer.alts?.[lang.id]) || []

  const handleMic = () => {
    if (isListening) { stopListening(); return }
    startListening()
  }

  // Konuşma bitince değerlendir
  useEffect(() => {
    if (!transcript || isListening) return
    const candidates = [target, ...altList]
    let best = 0
    candidates.forEach(c => {
      const s = getPronunciationScore(transcript, c).score
      if (s > best) best = s
    })
    const level = best >= 80 ? 'excellent' : best >= 55 ? 'good' : 'tryagain'
    setResult({ score: best, level })
    // Doğruysa: çocuk sorduysa botun cevabını seslendir
    if (best >= 55 && childAsks) {
      setTimeout(() => speak(T(item.answer, lang.id)), 500)
    }
  }, [transcript, isListening]) // eslint-disable-line

  const next = () => {
    if (idx + 1 >= data.qa.length) onDone()
    else setIdx(i => i + 1)
  }

  const roleLabel = childAsks ? '🎤 Sıra sende: SEN SOR' : '🎤 Sıra sende: SEN CEVAPLA'

  return (
    <div style={S.body}>
      <Badge>2. Konuş — Soru & Cevap ({idx + 1}/{data.qa.length})</Badge>

      {/* Bot / karşı taraf balonu */}
      {!childAsks && (
        <Bubble side="bot" text={T(item.prompt, lang.id)} tr={T(item.prompt, 'tr')}
                speaking={isSpeaking} onSpeak={() => speak(T(item.prompt, lang.id))} />
      )}
      {childAsks && result && result.score >= 55 && (
        <Bubble side="bot" text={T(item.answer, lang.id)} tr={T(item.answer, 'tr')}
                speaking={isSpeaking} onSpeak={() => speak(T(item.answer, lang.id))} />
      )}

      {/* Çocuğun söylemesi gereken (hedef) */}
      <div style={{ ...S.roleBox, borderColor: childAsks ? '#FDE68A' : '#BAE6FD',
                    background: childAsks ? '#FFFBEB' : '#EFF8FF' }}>
        <div style={S.roleLabel}>{roleLabel}</div>
        <div style={S.roleTarget}>{target}</div>
        <div style={S.roleTr}>{childAsks ? T(item.prompt, 'tr') : T(item.answer, 'tr')}</div>
      </div>

      {/* Mikrofon / sonuç */}
      {sttSupported ? (
        <>
          <button onClick={handleMic} disabled={!!result}
                  style={{ ...S.micBtn, background: isListening ? '#FEE2E2' : '#0891B2',
                           color: isListening ? '#DC2626' : 'white',
                           opacity: result ? 0.5 : 1 }}>
            {isListening ? '🔴 Dinliyorum...' : '🎤 Söyle'}
          </button>
          {transcript && <div style={S.transcript}>Duyduğum: "{transcript}"</div>}
          {result && <ResultBanner result={result} />}
        </>
      ) : (
        // Mikrofon yoksa: dinle + "söyledim" fallback
        <button onClick={() => { speak(target); setResult({ score: 100, level: 'excellent' }) }}
                style={S.micBtn}>
          🔊 Dinle ve Tekrarla
        </button>
      )}

      {result && (
        <button onClick={next} style={S.primaryBtn}>
          {idx + 1 >= data.qa.length ? 'Cümle Türetmeye Geç →' : 'Devam →'}
        </button>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════
// AŞAMA 3 — CÜMLE TÜRETMECE (kelime bankası + yazma)
// ══════════════════════════════════════════════════════
function GenerateStage({ data, lang, speak, onDone }) {
  const [idx, setIdx]       = useState(0)
  const [picked, setPicked] = useState([])
  const [typed, setTyped]   = useState('')
  const [mode, setMode]     = useState('bank') // bank | type
  const [result, setResult] = useState(null)

  const item     = data.generate[idx]
  const bank     = item.wordBank?.[lang.id] || item.wordBank?.en || []
  const target   = T(item.answer, lang.id)
  const [shuffled] = useState(() => [...bank].sort(() => Math.random() - 0.5))

  useEffect(() => { setPicked([]); setTyped(''); setResult(null); setMode('bank') }, [idx])

  const built = picked.join(' ')

  const evaluate = (text) => {
    const r = checkAnswer(text, target)
    // Türetmecede tam eşleşme şart değil — anlamlı bir cümle kabul
    const ok = r.match || r.score >= 0.6
    setResult({ ok, score: Math.round((r.score || 0) * 100) })
    if (ok) setTimeout(() => speak(text), 300)
  }

  const next = () => {
    if (idx + 1 >= data.generate.length) onDone()
    else setIdx(i => i + 1)
  }

  return (
    <div style={S.body}>
      <Badge>3. Üret — Kendi cümleni kur ({idx + 1}/{data.generate.length})</Badge>

      <div style={S.patternCard}>
        <div style={S.patternLabel}>ÇERÇEVE</div>
        <div style={S.patternText}>{T(item.frame, lang.id)}</div>
        {item.hint?.tr && <div style={S.patternTr}>💡 {item.hint.tr}</div>}
      </div>

      {/* Mod seçici */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <TabBtn active={mode === 'bank'} onClick={() => setMode('bank')}>🧩 Kelime Diz</TabBtn>
        <TabBtn active={mode === 'type'} onClick={() => setMode('type')}>⌨️ Yaz</TabBtn>
      </div>

      {mode === 'bank' ? (
        <>
          {/* Kurulan cümle */}
          <div style={S.builtBox}>
            {picked.length === 0
              ? <span style={{ color: '#CBD5E1' }}>Kelimelere dokun...</span>
              : picked.map((w, i) => (
                  <span key={i} onClick={() => setPicked(p => p.filter((_, j) => j !== i))}
                        style={S.builtChip}>{w} ✕</span>
                ))}
          </div>
          {/* Kelime bankası */}
          <div style={S.bankWrap}>
            {shuffled.map((w, i) => (
              <button key={i} onClick={() => setPicked(p => [...p, w])} style={S.bankChip}>
                {w}
              </button>
            ))}
          </div>
          {!result && (
            <button onClick={() => evaluate(built)} disabled={!picked.length}
                    style={{ ...S.primaryBtn, opacity: picked.length ? 1 : 0.5 }}>
              Kontrol Et ✓
            </button>
          )}
        </>
      ) : (
        <>
          <input value={typed} onChange={e => setTyped(e.target.value)}
                 placeholder={T(item.frame, lang.id)} style={S.input} />
          {!result && (
            <button onClick={() => evaluate(typed)} disabled={!typed.trim()}
                    style={{ ...S.primaryBtn, opacity: typed.trim() ? 1 : 0.5 }}>
              Kontrol Et ✓
            </button>
          )}
        </>
      )}

      {result && (
        <>
          <div style={{ ...S.resultBanner,
                        background: result.ok ? '#F0FDF4' : '#FEF3C7',
                        borderColor: result.ok ? '#BBF7D0' : '#FDE68A',
                        color: result.ok ? '#15803D' : '#92400E' }}>
            {result.ok
              ? `🎉 Harika! Cümleni kurdun.`
              : `👍 İyi deneme! Örnek: "${target}"`}
          </div>
          <button onClick={next} style={S.primaryBtn}>
            {idx + 1 >= data.generate.length ? 'Bitir 🏁' : 'Sıradaki →'}
          </button>
        </>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════
// BİTİŞ
// ══════════════════════════════════════════════════════
function DoneStage({ data, onBack }) {
  const [isNew, setIsNew] = useState(false)
  useEffect(() => { setIsNew(markScenarioDone(data.id)) }, []) // eslint-disable-line
  return (
    <div style={{ ...S.body, alignItems: 'center', textAlign: 'center', paddingTop: '48px' }}>
      <div style={{ fontSize: '72px' }}>🏆</div>
      <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A' }}>Tebrikler!</div>
      <div style={{ fontSize: '15px', color: '#64748B', maxWidth: '300px', lineHeight: 1.7 }}>
        <strong>{data.emoji} {data.title}</strong> senaryosunu tamamladın.
        Dinledin, konuştun ve kendi cümleni kurdun! 💪
      </div>
      <div style={{
        background: isNew ? '#FEF3C7' : '#F0FDF4',
        border: `1px solid ${isNew ? '#FDE68A' : '#BBF7D0'}`,
        borderRadius: 14, padding: '12px 22px',
        fontSize: 15, fontWeight: 700, color: isNew ? '#92400E' : '#15803D',
      }}>
        {isNew ? '⭐ +25 XP kazandın!' : '✅ Bu senaryo zaten tamamlanmıştı'}
      </div>
      <button onClick={onBack} style={{ ...S.primaryBtn, maxWidth: '240px' }}>
        🔙 Senaryolara Dön
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// KÜÇÜK BİLEŞENLER
// ══════════════════════════════════════════════════════
function Header({ title, onBack, stage }) {
  const steps = ['teach', 'qa', 'generate']
  const cur = steps.indexOf(stage)
  return (
    <div style={S.header}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: 600, margin: '0 auto' }}>
        <button onClick={onBack} style={S.backBtn}>←</button>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{title}</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {steps.map((_, i) => (
            <div key={i} style={{ width: 22, height: 5, borderRadius: 3,
              background: i <= cur ? '#0891B2' : '#E2E8F0' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Bubble({ side, text, tr, speaking, onSpeak }) {
  const isBot = side === 'bot'
  return (
    <div style={{ display: 'flex', flexDirection: isBot ? 'row' : 'row-reverse',
                  alignItems: 'flex-end', gap: 8 }}>
      <div style={S.avatar}>{isBot ? '🧑' : '🦅'}</div>
      <div style={{ maxWidth: '80%' }}>
        <div style={{ ...S.bubble, background: isBot ? '#F1F5F9' : '#FEF3C7',
                      border: `1px solid ${isBot ? '#E2E8F0' : '#FDE68A'}` }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>{text}</div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontStyle: 'italic' }}>{tr}</div>
        </div>
        <button onClick={onSpeak} style={S.miniSpeak}>{speaking ? '🔊 ...' : '🔊 Dinle'}</button>
      </div>
    </div>
  )
}

function ResultBanner({ result }) {
  const map = {
    excellent: { bg: '#F0FDF4', bd: '#BBF7D0', c: '#15803D', t: `🎉 Mükemmel! (%${result.score})` },
    good:      { bg: '#EFF8FF', bd: '#BAE6FD', c: '#0369A1', t: `👍 Güzel! (%${result.score})` },
    tryagain:  { bg: '#FEF3C7', bd: '#FDE68A', c: '#92400E', t: `🙂 Az kaldı! (%${result.score})` },
  }
  const m = map[result.level] || map.good
  return <div style={{ ...S.resultBanner, background: m.bg, borderColor: m.bd, color: m.c }}>{m.t}</div>
}

const Badge   = ({ children }) => <div style={S.stageBadge}>{children}</div>
const TabBtn  = ({ active, children, onClick }) => (
  <button onClick={onClick} style={{ ...S.tabBtn,
    background: active ? '#0891B2' : '#F1F5F9', color: active ? 'white' : '#64748B' }}>
    {children}
  </button>
)
const Center  = ({ emoji, text }) => (
  <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 12 }}>
    <div style={{ fontSize: 32 }}>{emoji}</div>
    <div style={{ fontSize: 14, color: '#94A3B8' }}>{text}</div>
  </div>
)

// ══════════════════════════════════════════════════════
// STİLLER
// ══════════════════════════════════════════════════════
const S = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  header: { background: 'white', borderBottom: '1px solid #E2E8F0', padding: '12px 20px',
            position: 'sticky', top: 0, zIndex: 10 },
  backBtn: { background: '#F1F5F9', border: 'none', borderRadius: 8, width: 32, height: 32,
             cursor: 'pointer', fontSize: 16 },
  body: { maxWidth: 600, margin: '0 auto', padding: '20px 24px 48px',
          display: 'flex', flexDirection: 'column', gap: 14 },
  stageBadge: { alignSelf: 'flex-start', background: '#EFF8FF', color: '#0891B2',
                borderRadius: 8, padding: '5px 12px', fontSize: 13, fontWeight: 700 },
  patternCard: { background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: 18 },
  patternLabel: { fontSize: 11, fontWeight: 800, color: '#CBD5E1', letterSpacing: 1 },
  patternText: { fontSize: 20, fontWeight: 800, color: '#0F172A', marginTop: 6 },
  patternTr: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  exampleRow: { display: 'flex', alignItems: 'center', gap: 12, background: 'white',
                border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px 16px', cursor: 'pointer' },
  speakerIcon: { fontSize: 20, flexShrink: 0 },
  exampleTarget: { fontSize: 15, fontWeight: 700, color: '#0F172A' },
  exampleTr: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  roleBox: { border: '1.5px solid', borderRadius: 16, padding: 16 },
  roleLabel: { fontSize: 12, fontWeight: 800, color: '#0891B2' },
  roleTarget: { fontSize: 18, fontWeight: 700, color: '#0F172A', marginTop: 6 },
  roleTr: { fontSize: 13, color: '#94A3B8', marginTop: 3 },
  micBtn: { height: 52, border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
            cursor: 'pointer', background: '#0891B2', color: 'white' },
  transcript: { fontSize: 13, color: '#64748B', fontStyle: 'italic', textAlign: 'center' },
  resultBanner: { border: '1px solid', borderRadius: 12, padding: '14px 16px',
                  fontSize: 14, fontWeight: 700, textAlign: 'center' },
  primaryBtn: { height: 52, background: '#0891B2', border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 700, color: 'white', cursor: 'pointer', marginTop: 4 },
  avatar: { width: 34, height: 34, borderRadius: '50%', background: '#F1F5F9',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 },
  bubble: { borderRadius: 16, padding: '12px 16px' },
  miniSpeak: { background: 'none', border: 'none', color: '#0891B2', fontSize: 12,
               fontWeight: 600, cursor: 'pointer', marginTop: 4, padding: 0 },
  tabBtn: { flex: 1, height: 42, border: 'none', borderRadius: 10, fontSize: 14,
            fontWeight: 700, cursor: 'pointer' },
  builtBox: { minHeight: 52, background: 'white', border: '1.5px dashed #CBD5E1', borderRadius: 12,
              padding: 12, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  builtChip: { background: '#EFF8FF', border: '1px solid #BAE6FD', color: '#0369A1',
               borderRadius: 8, padding: '6px 10px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  bankWrap: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  bankChip: { background: 'white', border: '1px solid #E2E8F0', borderRadius: 8,
              padding: '8px 14px', fontSize: 14, fontWeight: 600, color: '#334155', cursor: 'pointer' },
  input: { height: 52, border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '0 16px',
           fontSize: 15, fontFamily: 'inherit', outline: 'none' },
}
