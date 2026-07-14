/**
 * ChatBot.jsx — Birleşik konuşma pratiği (çekirdek üzerinde yeniden kuruldu)
 *
 * Eski conversationService "pair" sistemi kaldırıldı. Artık:
 *   contentStore  → TR içerik (kategori bazlı)
 *   quizEngine    → pick (mcq) / type (written) / speak (audio) soruları
 *   progressStore → doğru/yanlış kaydı (SM-2 + XP)
 *   chatEngine    → övgü/geri bildirim tonları
 *
 * Bot TR ipucu verir ("... nasıl denir?"), kullanıcı hedef dilde yanıtlar.
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useWords, availableLevels } from '../core/contentStore'
import { useLang } from '../core/langState'
import { TARGET_LANGS } from '../core/languages'
import { buildQuestion, grade } from '../core/quizEngine'
import { recordAnswer } from '../core/progressStore'
import { useSpeech } from '../hooks/useSpeech'

const PRAISE = ['Harika! 🎉', 'Süper! 👏', 'Çok iyi! ⭐', 'Mükemmel! 💪', 'Aferin! 🌟']
const RETRY  = ['Az kaldı 🙂', 'Neredeyse! ', 'Yaklaştın 💡']
const rnd = (a) => a[Math.floor(Math.random() * a.length)]

const CAT_LABELS = {
  all: 'Karışık', food: 'Yiyecek', animals: 'Hayvanlar', colors: 'Renkler', numbers: 'Sayılar',
  family: 'Aile', body: 'Vücut', home: 'Ev', transport: 'Ulaşım', fruits: 'Meyveler',
  school: 'Okul', clothing: 'Kıyafet', greetings: 'Selamlaşma', questions: 'Sorular',
  vegetables: 'Sebzeler', time: 'Zaman', jobs: 'Meslekler', sports: 'Spor',
  places: 'Yerler', adjectives: 'Sıfatlar', verbs: 'Fiiller',
}
const MODES = [
  { id: 'mcq',     label: 'Seç',   emoji: '🔠' },
  { id: 'written', label: 'Yaz',   emoji: '⌨️' },
  { id: 'audio',   label: 'Konuş', emoji: '🎤' },
]

export default function ChatBot() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [lang] = useLang()

  const [level, setLevel]       = useState('A1')
  const [category, setCategory] = useState(params.get('category') || 'all')
  const [mode, setMode]         = useState('mcq')
  const [phase, setPhase]       = useState('setup') // setup | chat | summary
  const levels = availableLevels()

  const { cards, loading, categories } = useWords({ maxLevel: level, category, lang })
  const poolCards = useWords({ maxLevel: level, lang }).cards

  const { speak, startListening, stopListening, isListening, transcript, sttSupported } = useSpeech(lang)

  const [messages, setMessages] = useState([])
  const [queue, setQueue]   = useState([])
  const [qi, setQi]         = useState(0)
  const [answered, setAnswered] = useState(false)
  const [typed, setTyped]   = useState('')
  const [score, setScore]   = useState(0)
  const bottomRef = useRef(null)
  const listenedRef = useRef(false)

  const q = queue[qi]

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // ── Başlat ──
  const start = () => {
    const picked = [...cards].sort(() => Math.random() - 0.5).slice(0, 8)
    const qs = picked.map(c => buildQuestion(c, poolCards, mode))
    setQueue(qs); setQi(0); setScore(0); setAnswered(false); setTyped('')
    setMessages([{ from: 'bot', text: 'Merhaba! 👋 Hazırsan başlayalım.', tr: '' }])
    setPhase('chat')
  }

  // ── Yeni soruyu bot balonu olarak ekle ──
  useEffect(() => {
    if (phase !== 'chat' || !q) return
    setAnswered(false); setTyped(''); listenedRef.current = false
    setMessages(prev => [...prev, {
      from: 'bot',
      text: q.mode === 'audio' ? '🔊 Dinle ve söyle' : `"${q.source}" nasıl denir?`,
      tr: q.mode === 'audio' ? '(kelimeyi dinle)' : '',
      emoji: q.emoji,
    }])
    if (q.mode === 'audio') setTimeout(() => speak(q.audioText), 500)
  }, [qi, phase]) // eslint-disable-line

  // ── Sesli cevap değerlendirme ──
  useEffect(() => {
    if (mode !== 'audio' || !transcript || isListening || answered) return
    if (listenedRef.current) return
    listenedRef.current = true
    submitAnswer(transcript)
  }, [transcript, isListening]) // eslint-disable-line

  const submitAnswer = (given) => {
    if (!q || answered) return
    const g = grade(q, given)
    setAnswered(true)
    if (g.correct) setScore(s => s + 1)
    recordAnswer(q.id, g.correct, g.correct ? 4 : 0)
    setMessages(prev => [...prev,
      { from: 'user', text: given, correct: g.correct },
      { from: 'bot', text: g.correct ? rnd(PRAISE) : `${rnd(RETRY)} Doğrusu: ${q.answer}`, feedback: true, say: q.answer },
    ])
    setTimeout(() => speak(q.answer), 300)
  }

  const next = () => {
    if (qi + 1 >= queue.length) setPhase('summary')
    else setQi(i => i + 1)
  }

  // ════════ SETUP ════════
  if (phase === 'setup') {
    return (
      <div style={S.page}>
        <Header lang={lang} onBack={() => navigate('/dashboard')} title="🤖 Sohbet Pratiği" />
        <div style={S.body}>
          {levels.length > 1 && (
            <>
              <div style={S.label}>Seviye</div>
              <div style={S.chips}>
                {levels.map(lv => (
                  <button key={lv} onClick={() => { setLevel(lv); setCategory('all') }}
                    style={{ ...S.chip, ...(level === lv ? S.chipOn : {}) }}>{lv}</button>
                ))}
              </div>
            </>
          )}

          <div style={S.label}>Konu</div>
          <div style={S.chips}>
            {['all', ...categories.map(c => c.id)].map(c => (
              <button key={c} onClick={() => setCategory(c)}
                style={{ ...S.chip, ...(category === c ? S.chipOn : {}) }}>{CAT_LABELS[c] || c}</button>
            ))}
          </div>
          <div style={S.label}>Nasıl cevaplayacaksın?</div>
          <div style={S.chips}>
            {MODES.filter(m => m.id !== 'audio' || sttSupported).map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                style={{ ...S.chip, ...(mode === m.id ? S.chipOn : {}) }}>{m.emoji} {m.label}</button>
            ))}
          </div>
          <button onClick={start} disabled={loading || !cards.length}
            style={{ ...S.primary, opacity: loading || !cards.length ? 0.5 : 1 }}>
            {loading ? 'Yükleniyor...' : `Sohbete Başla (${cards.length} kelime)`}
          </button>
        </div>
      </div>
    )
  }

  // ════════ SUMMARY ════════
  if (phase === 'summary') {
    return (
      <div style={S.page}>
        <Header lang={lang} onBack={() => navigate('/dashboard')} title="🤖 Sohbet Pratiği" />
        <div style={{ ...S.body, alignItems: 'center', textAlign: 'center', paddingTop: 40 }}>
          <div style={{ fontSize: 64 }}>{score >= queue.length * 0.7 ? '🎊' : '💪'}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>Sohbet bitti!</div>
          <div style={{ fontSize: 16, color: '#64748B' }}>Skor: {score}/{queue.length}</div>
          <button onClick={() => setPhase('setup')} style={{ ...S.primary, maxWidth: 240 }}>Yeni Sohbet</button>
        </div>
      </div>
    )
  }

  // ════════ CHAT ════════
  return (
    <div style={{ ...S.page, display: 'flex', flexDirection: 'column' }}>
      <Header lang={lang} onBack={() => setPhase('setup')} title="🤖 Sohbet Pratiği"
              right={`${qi + 1}/${queue.length}`} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', maxWidth: 600, width: '100%', margin: '0 auto' }}>
        {messages.map((m, i) => (
          <Bubble key={i} m={m} onSpeak={m.say ? () => speak(m.say) : null} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Girdi alanı */}
      <div style={{ background: 'white', borderTop: '1px solid #E2E8F0', padding: '14px 18px 26px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          {!answered ? (
            q?.mode === 'mcq' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {q.options.map((opt, i) => (
                  <button key={i} onClick={() => submitAnswer(opt)} style={S.opt}>{opt}</button>
                ))}
              </div>
            ) : q?.mode === 'written' ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input autoFocus value={typed} onChange={e => setTyped(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && typed.trim() && submitAnswer(typed)}
                  placeholder="Cevabını yaz..." style={S.input} />
                <button onClick={() => typed.trim() && submitAnswer(typed)} style={S.send}>→</button>
              </div>
            ) : (
              <button onClick={() => isListening ? stopListening() : startListening()}
                style={{ ...S.primary, marginTop: 0, background: isListening ? '#DC2626' : '#0891B2' }}>
                {isListening ? '🔴 Dinliyorum...' : '🎤 Söyle'}
              </button>
            )
          ) : (
            <button onClick={next} style={{ ...S.primary, marginTop: 0 }}>
              {qi + 1 >= queue.length ? 'Bitir 🏁' : 'Devam →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Bileşenler ──
function Header({ title, onBack, right, lang }) {
  return (
    <div style={S.header}>
      <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={S.back}>←</button>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
          {title} <span style={{ color: '#94A3B8', fontWeight: 500 }}>· {TARGET_LANGS[lang]?.flag}</span>
        </div>
        {right && <div style={S.counter}>{right}</div>}
      </div>
    </div>
  )
}

function Bubble({ m, onSpeak }) {
  const bot = m.from === 'bot'
  return (
    <div style={{ display: 'flex', flexDirection: bot ? 'row' : 'row-reverse', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}>
      <div style={S.avatar}>{bot ? '🤖' : '🧒'}</div>
      <div style={{ maxWidth: '78%' }}>
        <div style={{
          background: bot ? '#F1F5F9' : (m.correct ? '#DCFCE7' : '#FEE2E2'),
          border: `1px solid ${bot ? '#E2E8F0' : (m.correct ? '#BBF7D0' : '#FECACA')}`,
          borderRadius: bot ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
          padding: '11px 15px',
        }}>
          {m.emoji && <span style={{ fontSize: 22, marginRight: 6 }}>{m.emoji}</span>}
          <span style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>{m.text}</span>
          {onSpeak && <button onClick={onSpeak} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 6 }}>🔊</button>}
        </div>
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
  label: { fontSize: 12, fontWeight: 800, color: '#94A3B8', letterSpacing: .5, marginTop: 6 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: { background: 'white', border: '1px solid #E2E8F0', borderRadius: 999, padding: '7px 14px', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' },
  chipOn: { background: '#0891B2', borderColor: '#0891B2', color: 'white' },
  primary: { height: 52, background: '#0891B2', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, color: 'white', cursor: 'pointer', marginTop: 8, width: '100%' },
  opt: { background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '13px 14px', fontSize: 15, fontWeight: 600, color: '#0F172A', cursor: 'pointer' },
  input: { flex: 1, height: 50, border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '0 16px', fontSize: 16, fontFamily: 'inherit', outline: 'none' },
  send: { width: 50, height: 50, background: '#0891B2', border: 'none', borderRadius: 12, color: 'white', fontSize: 20, cursor: 'pointer' },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 },
}
