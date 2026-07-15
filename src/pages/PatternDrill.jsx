/**
 * PatternDrill.jsx — "Kalıp Değiştirmece" (cümle YAPISI öğrenme)
 *
 * İskelet sabit, yuva (slot) değişir. Çocuk yuvayı değiştirerek aynı
 * yapıyla farklı cümleler üretir → cümle yapısını içselleştirir.
 * Renklendirilmiş yuva + yapı açıklaması ile yapı açıkça öğretilir.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../core/langState'
import { TARGET_LANGS } from '../core/languages'
import { useSpeech } from '../hooks/useSpeech'
import { PATTERNS } from '../data/patterns'
import { addXp } from '../core/progressStore'
import * as sfx from '../core/sfx'

const T = (o, l) => o?.[l] || o?.en || ''

export default function PatternDrill() {
  const navigate = useNavigate()
  const [lang] = useLang()
  const { speak } = useSpeech(lang)

  const [pi, setPi]       = useState(0)
  const [made, setMade]   = useState([])   // bu kalıpta üretilen yuva indexleri
  const [started, setStarted] = useState(false)

  const p = PATTERNS[pi]
  const skeleton = T(p.skeleton, lang)
  const [head, tail] = skeleton.split('___')

  const produce = (slot, i) => {
    if (made.includes(i)) return
    const filled = skeleton.replace('___', T(slot, lang))
    sfx.correct(); addXp(3)
    speak(filled)
    setMade(m => [...m, i])
  }

  const allMade = made.length >= p.slots.length
  const nextPattern = () => {
    if (pi + 1 >= PATTERNS.length) { sfx.reward(); setStarted(false); setPi(0) }
    else { setPi(pi + 1); setMade([]) }
  }

  if (!started) {
    return (
      <div style={S.page}>
        <Header onBack={() => navigate('/learn-hub')} lang={lang} />
        <div style={{ ...S.body, alignItems: 'center', textAlign: 'center', paddingTop: 36 }}>
          <div style={{ fontSize: 60 }}>🔧</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Kalıp Değiştirmece</div>
          <div style={{ fontSize: 15, color: '#64748B', maxWidth: 330, lineHeight: 1.6 }}>
            Cümle iskeleti sabit kalır, sadece bir kelime değişir. Aynı yapıyla
            birçok cümle kurarak <b>cümle yapısını</b> öğren! 🔩
          </div>
          <button onClick={() => { setStarted(true); setPi(0); setMade([]) }}
            style={{ ...S.primary, maxWidth: 280 }}>Başla ({PATTERNS.length} kalıp)</button>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      <Header onBack={() => setStarted(false)} lang={lang} right={`${pi + 1}/${PATTERNS.length}`} />
      <div style={S.body}>
        {/* Yapı açıklaması */}
        <div style={S.noteBox}>🔩 {p.note}</div>

        {/* Renklendirilmiş iskelet */}
        <div style={S.skelCard}>
          <div style={S.skelLabel}>KALIP</div>
          <div style={S.skelText}>
            {head}<span style={S.slot}>___</span>{tail}
          </div>
          <div style={S.skelTr}>{p.tr}</div>
        </div>

        <div style={S.hint}>👇 Yuvaya farklı kelimeler koy, cümleyi duy</div>

        {/* Yuva seçenekleri → üretilen cümleler */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {p.slots.map((slot, i) => {
            const done = made.includes(i)
            const filled = skeleton.replace('___', T(slot, lang))
            const filledTr = p.tr.replace('___', slot.tr)
            return (
              <button key={i} onClick={() => done ? speak(filled) : produce(slot, i)}
                style={{ ...S.slotBtn, ...(done ? S.slotDone : {}) }}>
                <span style={{ fontWeight: 800, color: done ? '#15803D' : '#0891B2', flexShrink: 0 }}>
                  {T(slot, lang)}
                </span>
                {done
                  ? <span style={{ flex: 1, textAlign: 'left' }}>
                      <span style={{ color: '#0F172A', fontWeight: 600 }}>{filled}</span> 🔊
                      <span style={{ display: 'block', fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>{filledTr}</span>
                    </span>
                  : <span style={{ flex: 1, textAlign: 'left', color: '#94A3B8' }}>
                      dokun ve cümle kur
                      <span style={{ display: 'block', fontSize: 12, color: '#CBD5E1' }}>{filledTr}</span>
                    </span>}
              </button>
            )
          })}
        </div>

        {allMade && (
          <div style={{ ...S.banner, background: '#F0FDF4', borderColor: '#BBF7D0', color: '#15803D' }}>
            🎉 Bu yapıyla {p.slots.length} cümle kurdun!
          </div>
        )}
        <button onClick={nextPattern} style={{ ...S.primary, opacity: made.length ? 1 : 0.6 }}>
          {pi + 1 >= PATTERNS.length ? 'Bitir 🏁' : 'Sonraki Kalıp →'}
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
          🔧 Kalıp Değiştirmece <span style={{ color: '#94A3B8', fontWeight: 500 }}>· {TARGET_LANGS[lang]?.flag}</span>
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
  body: { maxWidth: 560, margin: '0 auto', padding: '20px 24px 48px', display: 'flex', flexDirection: 'column', gap: 12 },
  noteBox: { background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#92400E' },
  skelCard: { background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: 20, textAlign: 'center' },
  skelLabel: { fontSize: 11, fontWeight: 800, color: '#CBD5E1', letterSpacing: 1 },
  skelText: { fontSize: 22, fontWeight: 800, color: '#0F172A', marginTop: 6 },
  slot: { display: 'inline-block', minWidth: 44, borderRadius: 6, background: '#EFF8FF', color: '#0891B2', border: '2px dashed #0891B2', padding: '0 8px' },
  skelTr: { fontSize: 13, color: '#94A3B8', marginTop: 6 },
  hint: { fontSize: 13, color: '#64748B', textAlign: 'center' },
  slotBtn: { display: 'flex', alignItems: 'center', gap: 10, background: 'white', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '13px 16px', fontSize: 15, cursor: 'pointer', textAlign: 'left' },
  slotDone: { background: '#F0FDF4', borderColor: '#BBF7D0' },
  primary: { height: 52, background: '#0891B2', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, color: 'white', cursor: 'pointer', marginTop: 6, width: '100%' },
  banner: { border: '1px solid', borderRadius: 12, padding: '12px 16px', fontSize: 14, fontWeight: 700, textAlign: 'center' },
}
