/**
 * DialogueComplete.jsx — "Diyalog Tamamlama"
 *
 * Bir sohbette eksik bırakılan repliği doğru seçenekle tamamla.
 * Cümlenin diyalog akışındaki YERİNİ ve uygunluğunu öğretir.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../core/langState'
import { TARGET_LANGS } from '../core/languages'
import { useSpeech } from '../hooks/useSpeech'
import { addXp } from '../core/progressStore'
import * as sfx from '../core/sfx'

const dialogueMods = import.meta.glob('../data/dialogues/*.json')
const shuffle = (a) => [...a].sort(() => Math.random() - 0.5)

// Diyaloglardan tamamlama turları üret
async function buildRounds(lang) {
  const mods = await Promise.all(Object.values(dialogueMods).map(fn => fn()))
  const dialogues = mods.map(m => m.default).filter(d => d?.lines?.length)
  // Tüm replikler (yanıltıcı için)
  const allLines = []
  dialogues.forEach(d => d.lines.forEach(l => { if (l[lang]) allLines.push(l[lang]) }))

  const rounds = []
  for (const d of dialogues) {
    const lines = d.lines.filter(l => l[lang])
    if (lines.length < 3) continue
    // Ortadaki bir repliği boşlukla (ilk değil)
    for (let attempt = 0; attempt < 2; attempt++) {
      const bi = 1 + Math.floor(Math.random() * (lines.length - 1))
      const answer = lines[bi][lang]
      const distractors = shuffle(allLines.filter(t => t !== answer)).slice(0, 3)
      rounds.push({
        title: `${d.emoji || '💬'} ${d.title || ''}`,
        context: lines.slice(Math.max(0, bi - 2), bi).map((l, i) => ({
          speaker: l.speaker, text: l[lang], tr: l.tr, me: l.speaker === d.roles?.[0],
        })),
        blankSpeaker: lines[bi].speaker,
        blankMe: lines[bi].speaker === d.roles?.[0],
        tr: lines[bi].tr,
        answer,
        options: shuffle([answer, ...distractors]),
      })
    }
  }
  return shuffle(rounds)
}

export default function DialogueComplete() {
  const navigate = useNavigate()
  const [lang] = useLang()
  const { speak } = useSpeech(lang)

  const [rounds, setRounds] = useState([])
  const [loading, setLoading] = useState(true)
  const [queue, setQueue] = useState([])
  const [qi, setQi] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true)
    buildRounds(lang).then(r => { if (alive) { setRounds(r); setLoading(false) } })
    return () => { alive = false }
  }, [lang])

  const start = () => { setQueue(rounds.slice(0, 10)); setQi(0); setPicked(null); setScore(0) }
  const r = queue[qi]

  const pick = (opt) => {
    if (picked) return
    setPicked(opt)
    const ok = opt === r.answer
    if (ok) { sfx.correct(); setScore(s => s + 1); addXp(5); setTimeout(() => speak(r.answer), 250) }
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
          <div style={{ fontSize: 60 }}>🧩</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Diyalog Tamamlama</div>
          <div style={{ fontSize: 15, color: '#64748B', maxWidth: 330, lineHeight: 1.6 }}>
            Sohbette eksik olan repliği doğru seç. Cümlenin konuşmadaki
            yerini ve uygunluğunu öğren! 💬
          </div>
          {done && (
            <div style={{ ...S.banner, background: '#F0FDF4', borderColor: '#BBF7D0', color: '#15803D' }}>
              🎉 Bitti! {score}/{Math.min(10, rounds.length)} doğru
            </div>
          )}
          <button onClick={start} disabled={loading || rounds.length === 0}
            style={{ ...S.primary, opacity: loading || !rounds.length ? 0.5 : 1, maxWidth: 280 }}>
            {loading ? 'Yükleniyor...' : done ? 'Yeni Tur' : `Başla (${rounds.length} soru)`}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      <Header onBack={() => setQueue([])} lang={lang} right={`${qi + 1}/${queue.length}`} />
      <div style={S.body}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#64748B', textAlign: 'center' }}>{r.title}</div>

        {/* Sohbet bağlamı */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {r.context.map((l, i) => (
            <Bubble key={i} me={l.me} text={l.text} tr={l.tr} />
          ))}
          {/* Boşluk */}
          <Bubble me={r.blankMe} text="❓ ???" tr={r.tr} blank />
        </div>

        {!picked && <div style={S.hint}>👇 "{r.tr}" anlamına gelen repliği seç</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {r.options.map((opt, i) => {
            let st = { ...S.opt }
            if (picked) {
              if (opt === r.answer) st = { ...st, ...S.correct }
              else if (opt === picked) st = { ...st, ...S.wrong }
            }
            return <button key={i} disabled={!!picked} onClick={() => pick(opt)} style={st}>{opt}</button>
          })}
        </div>

        {picked && (
          <>
            <div style={{ ...S.banner,
              background: picked === r.answer ? '#F0FDF4' : '#FEF2F2',
              borderColor: picked === r.answer ? '#BBF7D0' : '#FECACA',
              color: picked === r.answer ? '#15803D' : '#B91C1C' }}>
              {picked === r.answer ? '✅ Doğru! +5 XP' : `❌ Doğrusu: ${r.answer}`}
              <button onClick={() => speak(r.answer)} style={S.miniPlay}>🔊</button>
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

function Bubble({ me, text, tr, blank }) {
  return (
    <div style={{ display: 'flex', flexDirection: me ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8 }}>
      <div style={S.avatar}>{me ? '🦅' : '🧑'}</div>
      <div style={{
        maxWidth: '78%',
        background: blank ? '#FFFBEB' : (me ? '#FEF3C7' : '#F1F5F9'),
        border: `1px solid ${blank ? '#FDE68A' : (me ? '#FDE68A' : '#E2E8F0')}`,
        borderRadius: me ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
        padding: '10px 14px',
      }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: blank ? '#92400E' : '#0F172A' }}>{text}</div>
        {tr && <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 3, fontStyle: 'italic' }}>{tr}</div>}
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
          💬 Diyalog Tamamlama <span style={{ color: '#94A3B8', fontWeight: 500 }}>· {TARGET_LANGS[lang]?.flag}</span>
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
  body: { maxWidth: 560, margin: '0 auto', padding: '18px 24px 48px', display: 'flex', flexDirection: 'column', gap: 12 },
  hint: { fontSize: 13, color: '#64748B', textAlign: 'center' },
  avatar: { width: 30, height: 30, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 },
  opt: { background: 'white', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '13px 16px', fontSize: 15, fontWeight: 600, color: '#0F172A', cursor: 'pointer', textAlign: 'left' },
  correct: { borderColor: '#16A34A', background: '#F0FDF4', color: '#15803D' },
  wrong: { borderColor: '#DC2626', background: '#FEF2F2', color: '#B91C1C' },
  primary: { height: 52, background: '#0891B2', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, color: 'white', cursor: 'pointer', width: '100%' },
  banner: { border: '1px solid', borderRadius: 12, padding: '14px 16px', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 },
  miniPlay: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 },
}
