/**
 * LearningReport.jsx — "📊 Raporum"
 *
 * Kullanıcının öğrendiği / zorlandığı her şeyin tek ekranda raporu:
 *   • Kelimeler   → progressStore (usta / öğrenilen / tekrar gerek)
 *   • Cümle kalıpları → sentenceStore (kalıp-türü özeti + tek tek cümleler)
 * Zorlandığı kelimelerden tek tıkla tekrar test (QuizCore review odağı).
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { load as loadProgress } from '../core/progressStore'
import { getSentenceReport } from '../core/sentenceStore'
import { loadUpToLevel } from '../core/contentStore'
import { getLang } from '../core/langState'
import { TARGET_LANGS } from '../core/languages'

// LearnedWords.jsx ile aynı sınıflama
function getLevel(correct, wrong) {
  if (correct >= 3 && correct > wrong) return 3   // ustalaşılan
  if (correct >= 1 && correct > wrong) return 2   // öğrenilen
  return 1                                        // tekrar gerek
}

export default function LearningReport() {
  const navigate = useNavigate()
  const lang = getLang()

  const [words, setWords]     = useState([])   // [{id, word, tr, emoji, correct, wrong, level}]
  const [loading, setLoading] = useState(true)
  const [sent, setSent]       = useState({ patterns: [], learned: [], struggling: [], totalSentences: 0 })

  const refreshSentences = () => setSent(getSentenceReport(lang))

  useEffect(() => {
    refreshSentences()
    const prog = loadProgress().words
    loadUpToLevel('B2').then(all => {
      const meta = {}
      all.forEach(w => { meta[w.id] = { word: w[lang] || w.en, tr: w.tr, emoji: w.emoji } })
      const enriched = Object.entries(prog).map(([id, s]) => {
        const correct = s.correct_count || 0
        const wrong   = s.wrong_count || 0
        return {
          id,
          ...(meta[id] ?? { word: id, tr: '—', emoji: '📝' }),
          correct, wrong,
          level: getLevel(correct, wrong),
        }
      })
      setWords(enriched)
      setLoading(false)
    })
    window.addEventListener('sentenceStatsUpdated', refreshSentences)
    return () => window.removeEventListener('sentenceStatsUpdated', refreshSentences)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const mastered = words.filter(w => w.level === 3)
  const learned  = words.filter(w => w.level === 2)
  const needWork = words.filter(w => w.level === 1)

  const startReviewTest = () => {
    const ids = needWork.map(w => w.id)
    if (!ids.length) return
    localStorage.setItem('aguilang_review_ids', JSON.stringify(ids))
    navigate('/quiz')
  }

  // ── Küçük parçalar ─────────────────────────────────────
  const WordRow = ({ w }) => (
    <div style={S.row}>
      <span style={{ fontSize: 22, width: 30, textAlign: 'center', flexShrink: 0 }}>{w.emoji || '📝'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={S.rowTitle}>{w.word || w.id}</div>
        <div style={S.rowSub}>{w.tr || '—'}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>✅ {w.correct}</span>
        <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 600 }}>❌ {w.wrong}</span>
      </div>
    </div>
  )

  const WordSection = ({ label, color, items }) => {
    if (!items.length) return null
    return (
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 10, padding: '0 4px' }}>
          {label} ({items.length})
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 0 }}>
          {items.map(w => <WordRow key={w.id} w={w} />)}
        </div>
      </div>
    )
  }

  const SentenceRow = ({ c }) => (
    <div style={S.row}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={S.rowTitle}>{c.target}</div>
        <div style={S.rowSub}>{c.tr || '—'}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>✅ {c.correct}</span>
        <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 600 }}>❌ {c.wrong}</span>
      </div>
    </div>
  )

  const totalWords = words.length

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/dashboard')} style={S.back}>←</button>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 800, color: '#0F172A' }}>
              📊 Öğrenme Raporum
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>
              {loading ? 'Yükleniyor...' : `🇹🇷 → ${TARGET_LANGS[lang]?.flag || ''} · öğrendiğin her şey`}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 24px 60px' }}>

        {/* Özet tile'lar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Öğrenilen kelime', count: mastered.length + learned.length, color: '#0891B2', bg: '#EFF8FF', border: '#BAE6FD' },
            { label: 'Zorlanılan kelime', count: needWork.length, color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' },
            { label: 'Öğrenilen cümle', count: sent.learned.length, color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
            { label: 'Zorlanılan cümle', count: sent.struggling.length, color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 800, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 11, color: s.color, marginTop: 3, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Pekiştirme kısayolu */}
        {!loading && (needWork.length > 0 || sent.struggling.length > 0) && (
          <button onClick={() => navigate('/reinforce')} style={S.reinforceBtn}>
            🎯 Zorlandıklarını Pekiştir ({needWork.length + sent.struggling.length}) →
          </button>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8', fontSize: 15 }}>Rapor yükleniyor...</div>
        ) : (
          <>
            {/* ── KELİMELER ── */}
            <div style={S.card}>
              <div style={S.cardTitle}>📖 Kelimeler</div>
              {totalWords === 0 ? (
                <div style={S.empty}>Henüz kelime çalışılmadı. Quiz çözünce burada görünecek.</div>
              ) : (
                <>
                  {needWork.length > 0 && (
                    <button onClick={startReviewTest} style={S.reviewBtn}>
                      🔄 Zorlandığım kelimelerden test ({needWork.length}) →
                    </button>
                  )}
                  <WordSection label="⭐⭐⭐ Ustalaşılan" color="#15803D" items={mastered} />
                  <WordSection label="⭐⭐ Öğrenilen"     color="#0891B2" items={learned} />
                  <WordSection label="🔄 Tekrar Gerek"   color="#EA580C" items={needWork} />
                </>
              )}
            </div>

            {/* ── CÜMLE KALIPLARI ── */}
            <div style={S.card}>
              <div style={S.cardTitle}>💬 Cümle Kalıpları</div>

              {sent.patterns.length === 0 && sent.totalSentences === 0 ? (
                <div style={S.empty}>
                  Henüz cümle çalışılmadı. Kartta "cümle kur", ✏️ Boşluk Doldur, 🧩 Cümle Kur veya 🔧 Kalıp Değiştirmece'yi dene.
                </div>
              ) : (
                <>
                  {/* Kalıp-türü çubukları */}
                  {sent.patterns.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                      {sent.patterns.map(p => (
                        <div key={p.fn} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', flexShrink: 0, width: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.label}
                          </span>
                          <div style={{ flex: 1, minWidth: 0, height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${p.rate}%`, borderRadius: 3, transition: 'width 0.4s',
                              background: p.rate >= 70 ? '#10B981' : p.rate >= 40 ? '#0891B2' : '#F59E0B' }} />
                          </div>
                          <span style={{ fontSize: 11, color: '#64748B', flexShrink: 0, width: 66, textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {p.correct}/{p.total} · %{p.rate}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Öğrenilen cümleler */}
                  {sent.learned.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#15803D', marginBottom: 10, padding: '0 4px' }}>
                        ✅ Öğrenilen Cümleler ({sent.learned.length})
                      </div>
                      {sent.learned.slice(0, 30).map((c, i) => <SentenceRow key={i} c={c} />)}
                    </div>
                  )}

                  {/* Zorlanılan cümleler */}
                  {sent.struggling.length > 0 && (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', marginBottom: 10, padding: '0 4px' }}>
                        🔁 Zorlandığın Cümleler ({sent.struggling.length})
                      </div>
                      {sent.struggling.slice(0, 30).map((c, i) => <SentenceRow key={i} c={c} />)}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const S = {
  back: { background: '#F1F5F9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card: { background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 16 },
  cardTitle: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 16 },
  row: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'white', border: '1px solid #E2E8F0', marginBottom: 6 },
  rowTitle: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis' },
  rowSub: { fontSize: 12, color: '#64748B', marginTop: 1 },
  empty: { textAlign: 'center', padding: 30, color: '#94A3B8', fontSize: 14, lineHeight: 1.6 },
  reviewBtn: { width: '100%', marginBottom: 16, padding: 12, background: '#FFF7ED', color: '#9C4600', border: '1.5px solid #FED7AA', borderRadius: 10, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  reinforceBtn: { width: '100%', marginBottom: 24, padding: 15, background: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)', color: 'white', border: 'none', borderRadius: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 800, cursor: 'pointer' },
}
