import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const ALL_CAT_IDS = [
  'animals','colors','numbers','fruits','vegetables','body','family',
  'school','food','greetings','questions','clothing','home','transport',
  'time','jobs','sports','places','adjectives','verbs',
]

function getLevel(correct, wrong) {
  if (correct >= 3 && correct > wrong) return 3
  if (correct >= 1 && correct > wrong) return 2
  return 1
}

export default function LearnedWords() {
  const navigate = useNavigate()
  const [wordMap, setWordMap]         = useState(null)
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')

  useEffect(() => {
    const lang = (() => {
      try { return JSON.parse(localStorage.getItem('aguilang_active_lang') || '{"id":"en"}') }
      catch { return { id: 'en' } }
    })()
    const stats = (() => {
      try { return JSON.parse(localStorage.getItem('aguilang_word_stats') || '{}') }
      catch { return {} }
    })()

    Promise.all(ALL_CAT_IDS.map(async catId => {
      try {
        const m = await import(`../data/${catId}-a1.json`)
        return m.default.translations?.[lang.id]?.words ?? []
      } catch { return [] }
    })).then(arrays => {
      const detailMap = {}
      arrays.flat().forEach(w => { detailMap[w.id] = { word: w.word, tr: w.tr, emoji: w.emoji } })
      const enriched = {}
      Object.entries(stats).forEach(([id, s]) => {
        enriched[id] = { ...(detailMap[id] ?? { word: id, tr: '—', emoji: '📝' }), ...s }
      })
      setWordMap(enriched)
      setLoading(false)
    })
  }, [])

  const filtered = Object.entries(wordMap || {}).filter(([id, w]) => {
    if (!search) return true
    const q = search.toLowerCase()
    return id.toLowerCase().includes(q) ||
      w.tr?.toLowerCase().includes(q) ||
      w.word?.toLowerCase().includes(q)
  })

  const mastered = filtered.filter(([, w]) => getLevel(w.correct, w.wrong) === 3)
  const learned  = filtered.filter(([, w]) => getLevel(w.correct, w.wrong) === 2)
  const needWork = filtered.filter(([, w]) => getLevel(w.correct, w.wrong) === 1)

  const WordRow = ({ id, w }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 14px', borderRadius: '10px',
      background: 'white', border: '1px solid #E2E8F0',
      marginBottom: '6px',
    }}>
      <span style={{ fontSize: '22px', width: '30px', textAlign: 'center', flexShrink: 0 }}>
        {w.emoji || '📝'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '14px', fontWeight: '700', color: '#0F172A',
        }}>{w.word || id}</div>
        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '1px' }}>{w.tr || '—'}</div>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '600' }}>✅ {w.correct || 0}</span>
        <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: '600' }}>❌ {w.wrong || 0}</span>
      </div>
    </div>
  )

  const Section = ({ label, color, items }) => {
    if (!items.length) return null
    return (
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontSize: '13px', fontWeight: '700', color,
          marginBottom: '10px', padding: '0 4px',
        }}>
          {label} ({items.length})
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '0',
        }}>
          {items.map(([id, w]) => <WordRow key={id} id={id} w={w} />)}
        </div>
      </div>
    )
  }

  const total = Object.keys(wordMap || {}).length

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{
        background: 'white', borderBottom: '1px solid #E2E8F0',
        padding: '14px 24px', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: '#F1F5F9', border: 'none', borderRadius: '8px',
                width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >←</button>
            <div>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '20px', fontWeight: '800', color: '#0F172A',
              }}>
                🎯 My Words
              </div>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '1px' }}>
                {loading ? 'Loading...' : `${total} words tracked`}
              </div>
            </div>
          </div>

          {/* Arama */}
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: '12px', top: '50%',
              transform: 'translateY(-50%)', fontSize: '15px',
            }}>🔍</span>
            <input
              type="text"
              placeholder="Search word or translation..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '9px 16px 9px 36px',
                border: '1px solid #E2E8F0', borderRadius: '10px',
                fontSize: '14px', outline: 'none',
                fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
                background: '#F8FAFC',
              }}
            />
          </div>
        </div>
      </div>

      {/* İçerik */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 24px 40px' }}>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8', fontSize: '15px' }}>
            Loading words...
          </div>
        ) : total === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <div style={{ fontSize: '16px', color: '#64748B' }}>
              No words studied yet.
            </div>
            <button
              onClick={() => navigate('/categories')}
              style={{
                marginTop: '20px', padding: '12px 24px',
                background: '#0891B2', color: 'white',
                border: 'none', borderRadius: '12px',
                fontSize: '14px', fontWeight: '700', cursor: 'pointer',
              }}
            >
              Start Learning →
            </button>
          </div>
        ) : (
          <>
            {/* Özet */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px', marginBottom: '24px',
            }}>
              {[
                { label: '⭐⭐⭐ Mastered',     count: mastered.length, color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
                { label: '⭐⭐ Learned',        count: learned.length,  color: '#0891B2', bg: '#EFF8FF', border: '#BAE6FD' },
                { label: '🔄 Needs Review',   count: needWork.length,  color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' },
              ].map((s, i) => (
                <div key={i} style={{
                  background: s.bg, border: `1px solid ${s.border}`,
                  borderRadius: '12px', padding: '14px',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '24px', fontWeight: '800', color: s.color,
                  }}>{s.count}</div>
                  <div style={{ fontSize: '11px', color: s.color, marginTop: '3px', fontWeight: '600' }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontSize: '14px' }}>
                No results for "{search}".
              </div>
            ) : (
              <>
                <Section label="⭐⭐⭐ Mastered"   color="#15803D" items={mastered} />
                <Section label="⭐⭐ Learned"      color="#0891B2" items={learned}  />
                <Section label="🔄 Needs Review" color="#EA580C" items={needWork}  />
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
