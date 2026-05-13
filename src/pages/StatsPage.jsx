import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDailyStats } from '../hooks/useDailyStats'
import { useTranslation } from '../i18n/translations'
import { getConvStats } from '../services/conversationService'

const ALL_CAT_IDS = [
  'animals','colors','numbers','fruits','vegetables','body','family',
  'school','food','greetings','questions','clothing','home','transport',
  'time','jobs','sports','places','adjectives','verbs',
]

const CAT_LABELS = {
  animals:'Animals', colors:'Colors', numbers:'Numbers',
  fruits:'Fruits', vegetables:'Vegetables', body:'Body',
  family:'Family', school:'School', food:'Food',
  greetings:'Greetings', questions:'Questions', clothing:'Clothing',
  home:'Home', transport:'Transport', time:'Time',
  jobs:'Jobs', sports:'Sports', places:'Places',
  adjectives:'Adjectives', verbs:'Verbs',
}

const CAT_EMOJIS = {
  animals:'🐾', colors:'🎨', numbers:'🔢', fruits:'🍎', vegetables:'🥦',
  body:'🫀', family:'👨‍👩‍👧', school:'🏫', food:'🍽️', greetings:'👋',
  questions:'❓', clothing:'👕', home:'🏠', transport:'🚗', time:'⏰',
  jobs:'💼', sports:'⚽', places:'📍', adjectives:'📝', verbs:'🏃',
}

function getLongestStreak(dailyStatsArr) {
  const activeDays = dailyStatsArr.filter(d => d.seen > 0)
  if (!activeDays.length) return 0
  let max = 1, cur = 1
  for (let i = 1; i < activeDays.length; i++) {
    const prev = new Date(activeDays[i - 1].key)
    const curr = new Date(activeDays[i].key)
    const diff = (curr - prev) / (1000 * 60 * 60 * 24)
    if (diff === 1) { cur++; max = Math.max(max, cur) }
    else cur = 1
  }
  return max
}

export default function StatsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [catProgress, setCatProgress] = useState([])
  const [loadingCats, setLoadingCats] = useState(true)

  const weekStats  = getDailyStats(7).slice(-4)
  const todayKey   = new Date().toISOString().split('T')[0]
  const maxSeen    = Math.max(...weekStats.map(d => d.seen), 1)

  const wordStats = (() => {
    try { return JSON.parse(localStorage.getItem('aguilang_word_stats') || '{}') }
    catch { return {} }
  })()

  const allDailyArr = (() => {
    try {
      const raw = JSON.parse(localStorage.getItem('aguilang_daily_stats') || '{}')
      return Object.entries(raw)
        .map(([key, v]) => ({ key, ...v }))
        .filter(d => d.seen > 0)
        .sort((a, b) => a.key.localeCompare(b.key))
    } catch { return [] }
  })()

  const totalWords    = Object.keys(wordStats).length
  const totalCorrect  = Object.values(wordStats).reduce((s, w) => s + (w.correct || 0), 0)
  const totalWrong    = Object.values(wordStats).reduce((s, w) => s + (w.wrong   || 0), 0)
  const totalInteract = totalCorrect + totalWrong
  const successRate   = totalInteract > 0 ? Math.round((totalCorrect / totalInteract) * 100) : 0
  const longestStreak = getLongestStreak(allDailyArr)
  const studyDays     = allDailyArr.length

  const [convStats, setConvStats] = useState(null)

  useEffect(() => {
    setConvStats(getConvStats())
  }, [])

  useEffect(() => {
    const lang = (() => {
      try { return JSON.parse(localStorage.getItem('aguilang_active_lang') || '{"id":"en"}') }
      catch { return { id: 'en' } }
    })()

    Promise.all(ALL_CAT_IDS.map(async catId => {
      try {
        const m = await import(`../data/${catId}-a1.json`)
        const words = m.default.translations?.[lang.id]?.words ?? []
        const wordIds = new Set(words.map(w => w.id))
        const seen = Object.keys(wordStats).filter(id => wordIds.has(id)).length
        return { catId, total: words.length, seen }
      } catch { return { catId, total: 0, seen: 0 } }
    })).then(results => {
      setCatProgress(
        results
          .filter(r => r.seen > 0 && r.total > 0)
          .sort((a, b) => (b.seen / b.total) - (a.seen / a.total))
      )
      setLoadingCats(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif', overflowX: 'hidden', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{
        background: 'white', borderBottom: '1px solid #E2E8F0',
        padding: '14px 24px', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: '#F1F5F9', border: 'none', borderRadius: '8px',
              width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >←</button>
          <div style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '20px', fontWeight: '800', color: '#0F172A',
          }}>
            📊 {t('statistics')}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '20px 16px 40px' }}>

        {/* Summary stats grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px', marginBottom: '20px',
        }}>
          {[
            { icon: '📖', label: t('unique words'),   value: totalWords },
            { icon: '✅', label: t('total correct'),   value: totalCorrect },
            { icon: '❌', label: t('total wrong'),     value: totalWrong },
            { icon: '🎯', label: t('success rate'),    value: `${successRate}%` },
            { icon: '🔥', label: t('longest streak'),  value: longestStreak },
            { icon: '📅', label: t('study days'),      value: studyDays },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: '14px',
              border: '1px solid #E2E8F0', padding: '14px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>{s.icon}</div>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '20px', fontWeight: '800', color: '#0F172A',
              }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* 7-day bar chart */}
        <div style={{
          background: 'white', borderRadius: '16px',
          border: '1px solid #E2E8F0', padding: '16px',
          marginBottom: '20px',
        }}>
          <div style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '15px', fontWeight: '700', color: '#0F172A', marginBottom: '16px',
          }}>
            📈 {t('last 7 days')}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '100px' }}>
            {weekStats.map(day => {
              const barH = day.seen > 0 ? Math.max(Math.round((day.seen / maxSeen) * 84), 8) : 4
              const isToday = day.key === todayKey
              return (
                <div
                  key={day.key}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100px' }}
                >
                  {day.seen > 0 && (
                    <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '4px', fontWeight: '600' }}>
                      {day.seen}
                    </div>
                  )}
                  <div style={{
                    width: '100%', height: `${barH}px`,
                    background: isToday ? '#0891B2' : day.seen > 0 ? '#BAE6FD' : '#F1F5F9',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s',
                  }} />
                  <div style={{
                    fontSize: '10px', marginTop: '6px',
                    color: isToday ? '#0891B2' : '#94A3B8',
                    fontWeight: isToday ? '700' : '400',
                    width: '100%', textAlign: 'center',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {t(day.dayName)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Conversation Stats */}
        {convStats && (
          <div style={{
            background: 'white', borderRadius: '16px',
            border: '1px solid #E2E8F0', padding: '20px',
            marginBottom: '20px',
          }}>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '15px', fontWeight: '700', color: '#0F172A', marginBottom: '16px',
            }}>
              💬 Conversation Practice
            </div>

            {/* Genel istatistikler */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
              {[
                { icon: '🎯', label: 'Sessions', value: convStats.totalSessions },
                { icon: '💬', label: 'Exchanges', value: convStats.totalExchanges },
                { icon: '⭐', label: 'Pts', value: convStats.totalScore },
              ].map((s, i) => (
                <div key={i} style={{
                  background: '#F8FAFC', borderRadius: '12px',
                  border: '1px solid #E2E8F0', padding: '12px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>{s.icon}</div>
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '18px', fontWeight: '800', color: '#0F172A',
                  }}>{s.value}</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Mod doğruluk */}
            {convStats.byMode.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {convStats.byMode.map(m => {
                  const modeEmoji = m.mode === 'pick' ? '👆' : m.mode === 'type' ? '⌨️' : '🎤'
                  return (
                    <div key={m.mode} style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', overflow: 'hidden' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#0F172A', flexShrink: 0, width: '52px' }}>
                        {modeEmoji} {m.mode.charAt(0).toUpperCase() + m.mode.slice(1)}
                      </span>
                      <div style={{ flex: 1, minWidth: 0, height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${m.accuracy}%`,
                          background: m.accuracy >= 70 ? '#10B981' : m.accuracy >= 40 ? '#0891B2' : '#F59E0B',
                          borderRadius: '3px', transition: 'width 0.4s',
                        }} />
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748B', flexShrink: 0, width: '56px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {m.correct}/{m.attempts} {m.accuracy}%
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Telaffuz skoru */}
              {convStats.avgPronunciation > 0 && (
                <div style={{
                  background: '#F0FDF4', borderRadius: '10px', border: '1px solid #86EFAC',
                  padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#166534' }}>
                    🎯 Avg Pronunciation
                  </span>
                  <span style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '16px', fontWeight: '800', color: '#16A34A',
                  }}>
                    {convStats.avgPronunciation}/100
                  </span>
                </div>
              )}

              {/* Recent Sessions */}
              {convStats.recentSessions && convStats.recentSessions.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{
                    fontSize: '13px', fontWeight: '700', color: '#0F172A', marginBottom: '8px',
                  }}>
                    🕐 Recent Sessions
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {convStats.recentSessions.map((s) => {
                      const date = new Date(s.startedAt);
                      const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      const diffEmoji = s.difficulty === 'easy' ? '🟢' : s.difficulty === 'medium' ? '🟡' : '🔴';
                      return (
                        <div key={s.id} style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          fontSize: '12px', color: '#0F172A',
                        }}>
                          <span style={{ fontWeight: '700' }}>{s.word}</span>
                          <span>{diffEmoji} {s.difficulty}</span>
                          <span style={{ color: '#64748B' }}>+{s.totalScore}</span>
                          <span style={{ color: '#94A3B8' }}>{formattedDate}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        {/* Category progress */}
        <div style={{
          background: 'white', borderRadius: '16px',
          border: '1px solid #E2E8F0', padding: '20px',
        }}>
          <div style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '15px', fontWeight: '700', color: '#0F172A', marginBottom: '16px',
          }}>
            📚 {t('category progress')}
          </div>

          {loadingCats ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94A3B8', fontSize: '14px' }}>
              {t('loading')}...
            </div>
          ) : catProgress.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94A3B8', fontSize: '14px' }}>
              {t('no categories studied yet')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {catProgress.map(({ catId, total, seen }) => {
                const pct = total > 0 ? Math.round((seen / total) * 100) : 0
                return (
                  <div key={catId}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>
                        {CAT_EMOJIS[catId]} {CAT_LABELS[catId] || catId}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>
                        {seen} / {total} · {pct}%
                      </div>
                    </div>
                    <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: pct >= 80 ? '#10B981' : pct >= 40 ? '#0891B2' : '#F59E0B',
                        borderRadius: '4px', transition: 'width 0.4s',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
