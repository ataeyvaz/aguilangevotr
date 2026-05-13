import { useState } from 'react'
import { useProgress, BADGE_DEFS } from '../hooks/useProgress'
import { useSettings } from '../hooks/useSettings'
import { useApp } from '../context/AppContext'
import { useTranslation } from '../i18n/translations'

function getConvSummary() {
  try {
    const sessions = JSON.parse(localStorage.getItem('aguilang_conv_sessions') || '[]')
    if (!sessions.length) return null
    const wordMap = {}
    sessions.forEach(s => {
      if (!s.word) return
      if (!wordMap[s.word]) wordMap[s.word] = { sessions: 0, totalScore: 0, correct: 0, total: 0 }
      wordMap[s.word].sessions++
      wordMap[s.word].totalScore += s.totalScore || 0
      wordMap[s.word].correct += s.completedExchanges || 0
      wordMap[s.word].total += s.totalExchanges || 0
    })
    const topWords = Object.entries(wordMap)
      .sort((a, b) => b[1].sessions - a[1].sessions)
      .slice(0, 5)
      .map(([word, stats]) => ({
        word,
        sessions: stats.sessions,
        accuracy: stats.total > 0 
          ? Math.round((stats.correct / stats.total) * 100) 
          : 0,
        totalScore: stats.totalScore,
      }))
    return {
      totalSessions: sessions.length,
      totalScore: sessions.reduce((s, x) => s + (x.totalScore || 0), 0),
      topWords,
    }
  } catch { return null }
}

const TTS_RATES = [
  { label: 'Slow',   value: 0.6 },
  { label: 'Normal', value: 0.9 },
  { label: 'Fast',   value: 1.2 },
]

const Divider = () => (
  <div style={{ height: '1px', background: '#E2E8F0', margin: '8px 0' }} />
)

const UI_LANG_OPTIONS = [
  { code: 'en', flag: '🇺🇸', label: 'EN' },
  { code: 'es', flag: '🇪🇸', label: 'ES' },
  { code: 'pt', flag: '🇧🇷', label: 'PT' },
]

export default function ProfilePage() {
  const profile   = JSON.parse(localStorage.getItem('aguilang_active_profile') || '{}')
  const profileId = profile.id || profile.name || 'default'

  const { earnedBadges } = useProgress(profileId)
  const { settings, save } = useSettings()
  const { uiLanguage, setUiLanguage } = useApp()
  const { t } = useTranslation()

  const earnedIds = new Set(earnedBadges.map(b => b.id))

  const [convSummary] = useState(getConvSummary)
  const [resetMsg,     setResetMsg]     = useState('')
  const [profileName,  setProfileName]  = useState(profile.name || 'Aguila')
  const [profileType,  setProfileType]  = useState(profile.type || 'adult')
  const [langToast,    setLangToast]    = useState('')
  const [saveToast,    setSaveToast]    = useState(false)

  const handleLangChange = (code) => {
    setUiLanguage(code)
    setLangToast(t('language changed successfully'))
    setTimeout(() => setLangToast(''), 2500)
  }

  const isChild = profileType === 'child'

  const saveProfile = (updates) => {
    const updated = { ...profile, ...updates }
    localStorage.setItem('aguilang_active_profile', JSON.stringify(updated))
  }

  const handleNameChange = (e) => {
    setProfileName(e.target.value)
  }

  const handleSaveName = () => {
    const name = profileName.trim() || 'Aguila'
    setProfileName(name)
    saveProfile({ name, initial: name[0]?.toUpperCase() })
    setSaveToast(true)
    setTimeout(() => setSaveToast(false), 2000)
  }

  const handleTypeChange = (type) => {
    setProfileType(type)
    saveProfile({ type })
    // Çocuk modunda TTS yavaşlar
    save({ ttsRate: type === 'child' ? 0.6 : 0.9 })
  }

  const confirmReset = (msg, fn) => {
    if (window.confirm(msg)) {
      fn()
      setResetMsg('Reset ✓')
      setTimeout(() => setResetMsg(''), 2500)
      window.dispatchEvent(new Event('wordStatsUpdated'))
    }
  }

  const resetWords = () => confirmReset(
    'All word stats will be deleted. Are you sure?',
    () => localStorage.setItem('aguilang_word_stats', '{}')
  )

  const resetDaily = () => confirmReset(
    'All daily data will be deleted. Are you sure?',
    () => localStorage.setItem('aguilang_daily_stats', '{}')
  )

  const resetAll = () => {
    if (!window.confirm('All word stats and daily data will be deleted. Your profile will be kept. Are you sure?')) return
    if (!window.confirm('Final confirmation: This action cannot be undone.')) return
    const RESET_KEYS = ['aguilang_word_stats', 'aguilang_daily_stats', 'aguilang_last_reset']
    RESET_KEYS.forEach(k => localStorage.removeItem(k))
    window.dispatchEvent(new Event('wordStatsUpdated'))
    setResetMsg('Reset ✓')
    setTimeout(() => setResetMsg(''), 2500)
  }

  const card = {
    background: 'white', borderRadius: '16px',
    border: '1px solid #E2E8F0', padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: '12px',
  }

  const sectionTitle = {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '14px', fontWeight: '700', color: '#0F172A', marginBottom: '16px',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{
        background: 'white', borderBottom: '1px solid #E2E8F0',
        padding: '14px 24px', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '20px', fontWeight: '800', color: '#0F172A',
          }}>
            👤 Profile
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '20px 24px 60px' }}>

        {/* ── 1. Profile Card ─────────────────────────────── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #0891B2, #0E7490)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '24px', fontWeight: '800', color: 'white', flexShrink: 0,
            }}>
              {(profileName || 'Aguila')[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'inline-block',
                background: isChild ? '#EFF8FF' : '#F0FDF4',
                border: `1px solid ${isChild ? '#BAE6FD' : '#BBF7D0'}`,
                borderRadius: '20px', padding: '2px 10px',
                fontSize: '12px', fontWeight: '700',
                color: isChild ? '#0891B2' : '#15803D',
              }}>
                {isChild ? '🧒 Child' : '👤 Adult'}
              </div>
            </div>
          </div>

          {/* Name input */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{
              display: 'block', fontSize: '13px', fontWeight: '600',
              color: '#64748B', marginBottom: '6px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              Your name:
            </label>
            <input
              type="text"
              value={profileName}
              onChange={handleNameChange}
              onKeyDown={e => e.key === 'Enter' && handleSaveName()}
              placeholder="Aguila"
              style={{
                width: '100%', padding: '10px 14px',
                border: '1.5px solid #E2E8F0', borderRadius: '10px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '15px', fontWeight: '700', color: '#0F172A',
                background: 'white', outline: 'none', boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleSaveName}
              style={{
                width: '100%', marginTop: '10px', padding: '12px',
                background: saveToast ? '#10B981' : '#0891B2',
                border: 'none', borderRadius: '10px', cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '14px', fontWeight: '700', color: 'white',
                transition: 'background 0.2s',
              }}
            >
              {saveToast ? `✓ ${t('saved')}` : t('save')}
            </button>
          </div>

          {/* Adult / Child toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            {[
              { type: 'adult', icon: '👤', label: 'Adult' },
              { type: 'child', icon: '🧒', label: 'Child' },
            ].map(({ type, icon, label }) => {
              const active = profileType === type
              return (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  style={{
                    flex: 1, padding: '10px 0',
                    background: active ? '#0891B2' : 'white',
                    border: `1.5px solid ${active ? '#0891B2' : '#E2E8F0'}`,
                    borderRadius: '10px', cursor: 'pointer',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '14px', fontWeight: '700',
                    color: active ? 'white' : '#64748B',
                    transition: 'all 0.15s',
                  }}
                >
                  {icon} {label}
                </button>
              )
            })}
          </div>

          <Divider />

          <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
            {[
              { icon: '⭐', label: 'Points', value: profile.points || 0 },
              { icon: '🏆', label: 'Level',  value: profile.level  || 1 },
              { icon: '🔥', label: 'Streak', value: `${profile.streak || 0} days` },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, background: '#F8FAFC', border: '1px solid #E2E8F0',
                borderRadius: '12px', padding: '12px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '18px', fontWeight: '800', color: '#0F172A',
                }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 2. Badges ───────────────────────────────────── */}
        <div style={card}>
          <div style={sectionTitle}>🏅 Badges</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
          }}>
            {BADGE_DEFS.map(badge => {
              const earned = earnedIds.has(badge.id)
              return (
                <div
                  key={badge.id}
                  title={`${badge.name}: ${badge.desc}`}
                  style={{
                    background: earned ? '#EFF8FF' : '#F8FAFC',
                    border: `1.5px solid ${earned ? '#BAE6FD' : '#E2E8F0'}`,
                    borderRadius: '10px', padding: '8px 4px',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '4px',
                    opacity: earned ? 1 : 0.5,
                  }}
                >
                  <div style={{ fontSize: '20px', position: 'relative' }}>
                    {badge.icon}
                    {!earned && (
                      <span style={{
                        position: 'absolute', bottom: -4, right: -6,
                        fontSize: '10px',
                      }}>🔒</span>
                    )}
                  </div>
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '9px', fontWeight: '700',
                    color: earned ? '#0F172A' : '#94A3B8',
                    textAlign: 'center', lineHeight: '1.2',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap', width: '100%',
                  }}>
                    {badge.name}
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* ── 3. My Stats ─────────────────────────────────── */}
      {convSummary && (
        <div style={{
          background: 'white', borderRadius: '16px',
          border: '1px solid #E2E8F0', padding: '20px',
          marginBottom: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '15px', fontWeight: '700', 
            color: '#0F172A', marginBottom: '16px',
          }}>
            💬 Conversation Stats
          </div>

          {/* Genel özet */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            {[
              { icon: '🎯', label: 'Sessions', value: convSummary.totalSessions },
              { icon: '⭐', label: 'Total pts', value: convSummary.totalScore },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, background: '#F8FAFC', borderRadius: '12px',
                border: '1px solid #E2E8F0', padding: '12px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '18px', fontWeight: '800', color: '#0F172A',
                }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Top words */}
          <div style={{
            fontSize: '12px', fontWeight: '700', 
            color: '#64748B', marginBottom: '8px',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            🏆 Most Practiced Words
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {convSummary.topWords.map((w, i) => (
              <div key={w.word} style={{
                display: 'flex', alignItems: 'center', 
                gap: '8px', fontSize: '13px',
              }}>
                <span style={{ 
                  color: '#94A3B8', fontWeight: '700', 
                  width: '16px', textAlign: 'right',
                }}>{i + 1}</span>
                <span style={{ fontWeight: '700', color: '#0F172A', flex: 1 }}>
                  {w.word}
                </span>
                <span style={{ color: '#64748B' }}>
                  {w.sessions}x
                </span>
                <span style={{ 
                  color: w.accuracy >= 70 ? '#16A34A' : '#F59E0B',
                  fontWeight: '700',
                }}>
                  {w.accuracy}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. Settings ─────────────────────────────────── */}
        <div style={card}>
          <div style={sectionTitle}>⚙️ Settings</div>

          {/* Interface Language */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <div style={{ fontWeight: '600', color: '#0F172A', fontSize: '14px' }}>
                  {t('interface language')}
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                  {t('change interface language')}
                </div>
              </div>
            </div>
            {langToast && (
              <div style={{
                background: '#F0FDF4', border: '1px solid #BBF7D0',
                borderRadius: '8px', padding: '8px 14px',
                fontSize: '13px', color: '#15803D', fontWeight: '600',
                marginBottom: '10px',
              }}>
                ✅ {langToast}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              {UI_LANG_OPTIONS.map(({ code, flag, label }) => {
                const active = uiLanguage === code
                return (
                  <button
                    key={code}
                    onClick={() => handleLangChange(code)}
                    style={{
                      flex: 1, padding: '10px 0',
                      background: active ? '#0891B2' : 'white',
                      border: `1.5px solid ${active ? '#0891B2' : '#E2E8F0'}`,
                      borderRadius: '10px', cursor: 'pointer',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '13px', fontWeight: '700',
                      color: active ? 'white' : '#64748B',
                      transition: 'all 0.15s',
                    }}
                  >
                    {flag} {label}
                  </button>
                )
              })}
            </div>
          </div>

          <Divider />

          {/* TTS Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', marginTop: '16px' }}>
            <div>
              <div style={{ fontWeight: '600', color: '#0F172A', fontSize: '14px' }}>Text to Speech (TTS)</div>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>Words are automatically read aloud</div>
            </div>
            <div
              onClick={() => save({ ttsEnabled: !settings.ttsEnabled })}
              style={{
                width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer',
                background: settings.ttsEnabled ? '#0891B2' : '#E2E8F0',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
              }}
            >
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                position: 'absolute', top: '3px',
                left: settings.ttsEnabled ? '23px' : '3px',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
          </div>

          <Divider />

          {/* Reading Speed */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontWeight: '600', color: '#0F172A', fontSize: '14px', marginBottom: '10px' }}>
              Reading Speed
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {TTS_RATES.map(r => {
                const active = Math.abs(settings.ttsRate - r.value) < 0.15
                return (
                  <button
                    key={r.label}
                    onClick={() => save({ ttsRate: r.value })}
                    style={{
                      flex: 1, padding: '8px 0',
                      background: active ? '#0891B2' : 'white',
                      border: `1.5px solid ${active ? '#0891B2' : '#E2E8F0'}`,
                      borderRadius: '10px', cursor: 'pointer',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '13px', fontWeight: '700',
                      color: active ? 'white' : '#64748B',
                      transition: 'all 0.15s',
                    }}
                  >
                    {r.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Reset Data — adults only */}
          {!isChild && (
            <>
              <Divider />
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontWeight: '700', color: '#EF4444', fontSize: '14px', marginBottom: '12px' }}>
                  Reset Data
                </div>
                {resetMsg && (
                  <div style={{
                    background: '#F0FDF4', border: '1px solid #BBF7D0',
                    borderRadius: '8px', padding: '8px 14px',
                    fontSize: '13px', color: '#15803D', fontWeight: '600',
                    marginBottom: '12px',
                  }}>
                    ✅ {resetMsg}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={resetWords}
                    style={{
                      width: '100%', padding: '11px', cursor: 'pointer',
                      background: '#FFF7ED', border: '1.5px solid #FED7AA',
                      borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                      color: '#9C4600', textAlign: 'left',
                    }}
                  >
                    📊 Reset word statistics
                  </button>
                  <button
                    onClick={resetDaily}
                    style={{
                      width: '100%', padding: '11px', cursor: 'pointer',
                      background: '#FFF7ED', border: '1.5px solid #FED7AA',
                      borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                      color: '#9C4600', textAlign: 'left',
                    }}
                  >
                    📅 Reset daily data
                  </button>
                  <button
                    onClick={resetAll}
                    style={{
                      width: '100%', padding: '11px', cursor: 'pointer',
                      background: '#FEF2F2', border: '1.5px solid #FECACA',
                      borderRadius: '10px', fontSize: '14px', fontWeight: '700',
                      color: '#DC2626', textAlign: 'left',
                    }}
                  >
                    🗑️ Reset All Learning Data
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
