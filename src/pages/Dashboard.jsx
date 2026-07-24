import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { getTodayStats, getDailyStats } from '../hooks/useDailyStats'
import { useTranslation } from '../i18n/translations'
import { loadUpToLevel } from '../core/contentStore'
import { getStats as coreStats, getHardWords as coreHardWords } from '../core/progressStore'
import { getLang } from '../core/langState'
import { TARGET_LANGS } from '../core/languages'
import { getUserLevel } from '../core/levels'

const DAILY_GOAL = 10

function getTodayConvStats() {
  try {
    const sessions = JSON.parse(localStorage.getItem('aguilang_conv_sessions') || '[]')
    const todayKey = new Date().toISOString().split('T')[0]
    const todaySessions = sessions.filter(s => s.startedAt?.startsWith(todayKey))
    return {
      count: todaySessions.length,
      totalScore: todaySessions.reduce((s, x) => s + (x.totalScore || 0), 0),
      exchanges: todaySessions.reduce((s, x) => s + (x.completedExchanges || 0), 0),
    }
  } catch { return { count: 0, totalScore: 0, exchanges: 0 } }
}

const QUICK_CATS = [
  { id: 'verbs',   name: 'Verbs',   emoji: '⚡', bg: '#EFF6FF' },
  { id: 'food',    name: 'Food',    emoji: '🍎', bg: '#FFF7ED' },
  { id: 'travel',  name: 'Travel',  emoji: '✈️', bg: '#F0FDF4' },
  { id: 'numbers', name: 'Numbers', emoji: '🔢', bg: '#FDF4FF' },
]

const LEVEL_COLORS = {
  A1: { bg: 'rgba(255,255,255,0.2)', text: 'white' },
  A2: { bg: 'rgba(139,92,246,0.3)',  text: 'white' },
}

export default function Dashboard() {
  const navigate                    = useNavigate()
  const { profile, currentPair }    = useApp()
  const { t } = useTranslation()

  // ── Çekirdek: tek ilerleme kaynağı (progressStore) ──
  const [srsStats, setSrsStats]   = useState({ new: 0, learning: 0, review: 0, mastered: 0, todayDue: 0, xp: 0, streakDays: 0 })
  const [hardIds, setHardIds]     = useState(() => coreHardWords())
  const [wordMap, setWordMap]     = useState({})
  const [convToday]               = useState(getTodayConvStats)
  const lang = getLang()

  useEffect(() => {
    let alive = true
    loadUpToLevel('B2').then(words => {
      if (!alive) return
      setSrsStats(coreStats(words))
      setWordMap(Object.fromEntries(words.map(w => [w.id, w])))
    })
    const refresh = () => setHardIds(coreHardWords())
    window.addEventListener('wordStatsUpdated', refresh)
    return () => { alive = false; window.removeEventListener('wordStatsUpdated', refresh) }
  }, [])

  // Zor kelimeleri gösterim için içerikle eşle
  const hardWords = hardIds.map(h => ({
    id: h.id,
    wrong: h.wrong_count, correct: h.correct_count,
    word: wordMap[h.id]?.tr || h.id,
    target: wordMap[h.id]?.[lang] || '',
  }))
  const liveStreak = srsStats.streakDays || 0

  const todayStats = getTodayStats()
  const weekStats  = getDailyStats(7).slice(-4)
  const todayKey   = new Date().toISOString().split('T')[0]
  const maxSeen    = Math.max(...weekStats.map(d => d.seen), 1)
  const goalPct    = Math.min(100, Math.round((todayStats.seen / DAILY_GOAL) * 100))

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? t('good morning') : hour < 18 ? t('good afternoon') : t('good evening')

  // TEK tutarlı seviye: eğitim ilerlemesi (XP) + varsa test sonucu
  const level = getUserLevel(srsStats.xp || 0)
  const lc    = LEVEL_COLORS[level] ?? LEVEL_COLORS.A1

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>

      {/* ── Header ────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0891B2 0%, #0E7490 100%)',
        padding: '32px 24px 40px',
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>

          {/* Name + avatar row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>
                {greeting}
              </div>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '28px', fontWeight: '800', color: 'white',
              }}>
                {profile?.name || 'Aguila'} 👋
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              {/* Avatar */}
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '20px', fontWeight: '700', color: 'white',
              }}>
                {profile?.initial || '🦅'}
              </div>
              {/* Level badge */}
              {level && (
                <div style={{
                  background: lc.bg, borderRadius: '20px',
                  padding: '2px 10px', fontSize: '12px',
                  fontWeight: '800', color: lc.text,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  border: '1px solid rgba(255,255,255,0.3)',
                }}>
                  {level}
                </div>
              )}
              {/* Dil rozeti — TR → hedef dil (langState) */}
              {TARGET_LANGS[lang] && (
                <div
                  onClick={() => navigate('/language')}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: '20px', padding: '3px 10px',
                    fontSize: '13px', fontWeight: '700', color: 'white',
                    border: '1px solid rgba(255,255,255,0.25)',
                    cursor: 'pointer', letterSpacing: '0.01em',
                  }}
                  title={`Türkçe → ${TARGET_LANGS[lang].native}`}
                >
                  🇹🇷 → {TARGET_LANGS[lang].flag}
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
              {[
                { icon: '🔥', value: liveStreak,                 label: t('streak') },
                { icon: '⭐', value: srsStats.xp || 0,           label: 'XP' },
                { icon: '🏆', value: level, label: t('level') },
              ].map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '12px', padding: '10px 16px',
              }}>
                <span style={{ fontSize: '20px' }}>{s.icon}</span>
                <div>
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '18px', fontWeight: '800', color: 'white', lineHeight: 1,
                  }}>{s.value}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────── */}
      <div style={{ maxWidth: '720px', margin: '-16px auto 0', padding: '0 24px 80px' }}>

        {/* SRS Stats card */}
        <div style={{
          background: 'white', borderRadius: '16px',
          border: '1px solid #E2E8F0', padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '16px',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '14px',
          }}>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '15px', fontWeight: '700', color: '#0F172A',
            }}>
              🗂️ Kelime İlerlemen
            </div>
            {srsStats.todayDue > 0 && (
              <div style={{
                background: '#FEF2F2', color: '#DC2626',
                borderRadius: '20px', padding: '2px 10px',
                fontSize: '11px', fontWeight: '700',
              }}>
                {srsStats.todayDue} bugün
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {[
              { key: 'new',      value: srsStats.new,      color: '#94A3B8', bg: '#F8FAFC' },
              { key: 'learning', value: srsStats.learning,  color: '#F59E0B', bg: '#FFFBEB' },
              { key: 'review',   value: srsStats.review,    color: '#0891B2', bg: '#EFF8FF' },
              { key: 'mastered', value: srsStats.mastered,  color: '#10B981', bg: '#F0FDF4' },
            ].map(({ key, value, color, bg }) => (
              <div key={key} style={{
                background: bg, borderRadius: '12px',
                padding: '12px 8px', textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '22px', fontWeight: '800', color, lineHeight: 1,
                }}>{value}</div>
                <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px', fontWeight: '600' }}>
                  {t(key)}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/study')}
            style={{
              width: '100%', marginTop: '14px', padding: '13px',
              background: '#0891B2', color: 'white',
              border: 'none', borderRadius: '12px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '15px', fontWeight: '700', cursor: 'pointer',
            }}
          >
            {srsStats.todayDue > 0
              ? `📚 ${t('study now')} (${srsStats.todayDue} ${t('due today')}) →`
              : `📚 ${t('study now')} →`}
          </button>
        </div>

        {/* Öğrenme Raporu girişi */}
        <button
          onClick={() => navigate('/report')}
          style={{
            width: '100%', marginBottom: '16px',
            background: 'linear-gradient(135deg, #6366F1 0%, #0891B2 100%)',
            border: 'none', borderRadius: '16px', padding: '18px 20px',
            display: 'flex', alignItems: 'center', gap: '14px',
            cursor: 'pointer', transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.92' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          <span style={{ fontSize: '30px' }}>📊</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '15px', fontWeight: '800', color: 'white', marginBottom: '2px',
            }}>Öğrenme Raporum</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
              Öğrendiğin & zorlandığın kelime ve cümleler
            </div>
          </div>
          <div style={{ marginLeft: 'auto', color: 'white', fontSize: '18px' }}>→</div>
        </button>

        {/* Zorlandıklarını Pekiştir */}
        <button
          onClick={() => navigate('/reinforce')}
          style={{
            width: '100%', marginBottom: '16px',
            background: 'white', border: '1.5px solid #FED7AA', borderRadius: '16px',
            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px',
            cursor: 'pointer', transition: 'transform 0.15s', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
        >
          <span style={{ fontSize: '30px' }}>🎯</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '15px', fontWeight: '800', color: '#9C4600', marginBottom: '2px',
            }}>Zorlandıklarını Pekiştir</div>
            <div style={{ fontSize: '12px', color: '#B45309' }}>
              Zor kelime & cümleleri öğret + soruyla pekiştir
            </div>
          </div>
          <div style={{ marginLeft: 'auto', color: '#EA580C', fontSize: '18px' }}>→</div>
        </button>

        {/* Dikte & Kayıt — ana ekrandan doğrudan erişim */}
        <button
          onClick={() => navigate('/dictation')}
          style={{
            width: '100%', marginBottom: '16px',
            background: 'white', border: '1.5px solid #DDD6FE', borderRadius: '16px',
            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px',
            cursor: 'pointer', transition: 'transform 0.15s', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
        >
          <span style={{ fontSize: '30px' }}>📝</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '15px', fontWeight: '800', color: '#5B21B6', marginBottom: '2px',
            }}>Dikte & Kayıt</div>
            <div style={{ fontSize: '12px', color: '#7C3AED' }}>
              Söyle, yazıya dönüşsün · telaffuz pratiği
            </div>
          </div>
          <div style={{ marginLeft: 'auto', color: '#7C3AED', fontSize: '18px' }}>→</div>
        </button>

        {/* Daily Goal */}
        <div style={{
          background: 'white', borderRadius: '16px',
          border: '1px solid #E2E8F0', padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: '#FFF7ED', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '20px',
            }}>🎯</div>
            <div>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '16px', fontWeight: '700', color: '#0F172A',
              }}>{t('daily goal')}</div>
              <div style={{ fontSize: '13px', color: '#64748B' }}>
                {t('complete n flash cards').replace('{n}', DAILY_GOAL)}
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: '12px', color: '#94A3B8', marginBottom: '6px',
          }}>
            <span>{t('progress')}</span>
            <span>{todayStats.seen} / {DAILY_GOAL}</span>
          </div>
          <div style={{
            height: '8px', background: '#F1F5F9',
            borderRadius: '4px', overflow: 'hidden', marginBottom: '16px',
          }}>
            <div style={{
              height: '100%', width: `${goalPct}%`,
              background: goalPct >= 100 ? '#10B981' : '#F59E0B',
              borderRadius: '4px', transition: 'width 0.5s',
            }} />
          </div>
          <button
            onClick={() => navigate('/categories')}
            style={{
              width: '100%', padding: '12px', background: 'white',
              color: '#0891B2', border: '1.5px solid #0891B2',
              borderRadius: '12px', cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '14px', fontWeight: '700',
            }}
          >
            {goalPct >= 100 ? `🏆 ${t('goal completed')}` : t('continue learning')}
          </button>
        </div>

        {/* Last 7 days */}
        <div style={{
          background: 'white', borderRadius: '16px',
          border: '1px solid #E2E8F0', padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '16px',
        }}>
          <div style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '14px', fontWeight: '700', color: '#0F172A', marginBottom: '14px',
          }}>
            📈 {t('last 7 days')}
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '64px' }}>
            {weekStats.map(day => {
              const barH   = day.seen > 0 ? Math.max(Math.round((day.seen / maxSeen) * 48), 6) : 3
              const isToday = day.key === todayKey
              return (
                <div key={day.key} style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'flex-end', height: '64px',
                }}>
                  <div style={{
                    width: '100%', height: `${barH}px`,
                    background: isToday ? '#0891B2' : day.seen > 0 ? '#BAE6FD' : '#F1F5F9',
                    borderRadius: '3px 3px 0 0', transition: 'height 0.3s',
                  }} />
                  <div style={{
                    fontSize: '9px', marginTop: '5px',
                    color: isToday ? '#0891B2' : '#94A3B8',
                    fontWeight: isToday ? '700' : '400',
                  }}>
                    {t(day.dayName)}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '10px' }}>
            Bugün: <strong style={{ color: '#0F172A' }}>{todayStats.seen}</strong> kelime ·
            Doğru: <strong style={{ color: '#10B981' }}>{todayStats.correct}</strong> ·
            Yanlış: <strong style={{ color: '#EF4444' }}>{todayStats.wrong}</strong>
          </div>
        </div>

        {/* Hard Words */}
        {hardWords.length > 0 && (
          <div style={{
            background: 'white', borderRadius: '16px',
            border: '1px solid #FED7AA', padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: '#FFF7ED', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '20px',
              }}>⚠️</div>
              <div>
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '16px', fontWeight: '700', color: '#0F172A',
                }}>Zor Kelimeler</div>
                <div style={{ fontSize: '13px', color: '#64748B' }}>
                  Bunları tekrar çalış
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {hardWords.map((w, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#FFF7ED', borderRadius: '10px',
                  padding: '10px 14px', border: '1px solid #FED7AA',
                }}>
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '14px', fontWeight: '700', color: '#9C4600',
                  }}>{w.word}{w.target ? ` · ${w.target}` : ''}</div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#EF4444', fontWeight: '600' }}>❌ {w.wrong}</span>
                    <span style={{ fontSize: '12px', color: '#10B981', fontWeight: '600' }}>✅ {w.correct}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                const ids = hardWords.map(w => w.id)
                if (ids.length) localStorage.setItem('aguilang_review_ids', JSON.stringify(ids))
                navigate('/quiz')
              }}
              style={{
                width: '100%', marginTop: '12px', padding: '11px',
                background: '#FFF7ED', color: '#9C4600',
                border: '1.5px solid #FED7AA', borderRadius: '10px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '14px', fontWeight: '700', cursor: 'pointer',
              }}
            >
              🔄 Bu Kelimeleri Tekrar Et
            </button>
          </div>
        )}

        {/* Today's Conversation Practice widget */}
        {convToday.count > 0 && (
          <div style={{
            margin: '0 16px 16px',
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '14px', fontWeight: '700', color: '#0F172A', marginBottom: '12px',
            }}>
              💬 Bugünkü Sohbet
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[
                { icon: '🎯', label: 'Oturum', value: convToday.count },
                { icon: '💬', label: 'Değişim', value: convToday.exchanges },
                { icon: '⭐', label: 'Puan', value: convToday.totalScore },
              ].map((s, i) => (
                <div key={i} style={{
                  flex: 1, background: '#F8FAFC', borderRadius: '12px',
                  border: '1px solid #E2E8F0', padding: '10px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '16px', marginBottom: '2px' }}>{s.icon}</div>
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '16px', fontWeight: '800', color: '#0F172A',
                  }}>{s.value}</div>
                  <div style={{ fontSize: '10px', color: '#94A3B8' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick categories */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '12px',
          }}>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '16px', fontWeight: '700', color: '#0F172A',
            }}>{t('categories')}</div>
            <button
              onClick={() => navigate('/categories')}
              style={{
                background: 'none', border: 'none',
                color: '#0891B2', fontSize: '13px',
                fontWeight: '600', cursor: 'pointer',
              }}
            >{t('see all')}</button>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '10px',
          }}>
            {QUICK_CATS.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  localStorage.setItem('aguilang_active_category', JSON.stringify(cat))
                  navigate('/learn')
                }}
                style={{
                  background: cat.bg, border: '1px solid #E2E8F0',
                  borderRadius: '14px', padding: '16px 12px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: '8px', cursor: 'pointer',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <span style={{ fontSize: '28px' }}>{cat.emoji}</span>
                <span style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '13px', fontWeight: '700', color: '#0F172A',
                }}>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Practice */}
        <button
          onClick={() => navigate('/chatbot')}
          style={{
            width: '100%', marginTop: '10px', marginBottom: '2px',
            background: 'linear-gradient(135deg, #0891B2 0%, #6366F1 100%)',
            border: 'none', borderRadius: '14px', padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: '14px',
            cursor: 'pointer', transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.9' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          <span style={{ fontSize: '32px' }}>🤖</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '15px', fontWeight: '800', color: 'white', marginBottom: '2px',
            }}>Chat Practice</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
              Practice real conversations → 8 scenarios
            </div>
          </div>
          <div style={{ marginLeft: 'auto', color: 'white', fontSize: '18px' }}>→</div>
        </button>

        {/* Mascot */}
        <div style={{
          background: 'white', borderRadius: '14px',
          border: '1px solid #E2E8F0', padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: '14px', marginTop: '16px',
        }}>
          <div style={{ fontSize: '36px' }}>🦅</div>
          <div>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '14px', fontWeight: '700', color: '#0F172A', marginBottom: '2px',
            }}>{t('keep going')}</div>
            <div style={{ fontSize: '13px', color: '#64748B' }}>
              {hardWords.length > 0
                ? `${hardWords.length} ${t('words need review')}`
                : t('come back tomorrow')}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
