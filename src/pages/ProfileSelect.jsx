import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ACTIVE_KEY = 'aguilang_active_profile'

const DEFAULT_PROFILE = {
  name: 'Aguila', type: 'adult', initial: 'A',
  points: 0, level: 1, streak: 0,
}

export default function ProfileSelect() {
  const navigate = useNavigate()

  const stored = (() => {
    try {
      const s = localStorage.getItem(ACTIVE_KEY)
      return s ? JSON.parse(s) : null
    } catch { return null }
  })()

  const [name, setName] = useState(stored?.name || 'Aguila')
  const [type, setType] = useState(stored?.type || 'adult')

  const handleStart = () => {
    const trimmed = name.trim() || 'Aguila'
    const profile = {
      ...(stored || DEFAULT_PROFILE),
      name: trimmed,
      initial: trimmed[0].toUpperCase(),
      type,
    }
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(profile))

    if (type === 'child') {
      const parentSettings = JSON.parse(
        localStorage.getItem('aguilang_lang_settings') ||
        '{"enabled":["en"],"priority":"en"}'
      )
      const langNames = { en: 'English', es: 'Spanish', pt: 'Portuguese' }
      const defaultLang = {
        id: parentSettings.priority,
        name: langNames[parentSettings.priority] || 'English',
        flag: `/flags/${parentSettings.priority === 'en' ? 'gb' : parentSettings.priority}.png`,
      }
      localStorage.setItem('aguilang_active_lang', JSON.stringify(defaultLang))
      navigate('/categories')
    } else {
      navigate('/language')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8FAFC',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Inter, sans-serif',
    }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '52px', marginBottom: '8px' }}>🦅</div>
        <h1 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '28px', fontWeight: '800', color: '#0F172A',
          margin: '0 0 6px',
        }}>AguiLangEvo</h1>
        <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>
          Welcome!
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Profile card */}
        <div style={{
          background: 'white', borderRadius: '16px',
          border: '1px solid #E2E8F0', padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '12px',
        }}>

          {/* Avatar */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #0891B2, #0E7490)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '28px', fontWeight: '800', color: 'white',
            }}>
              {(name || 'A')[0].toUpperCase()}
            </div>
          </div>

          {/* Name input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block', fontSize: '13px', fontWeight: '600',
              color: '#64748B', marginBottom: '6px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              Your name:
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Aguila"
              style={{
                width: '100%', padding: '11px 14px',
                border: '1.5px solid #E2E8F0', borderRadius: '10px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '15px', fontWeight: '700', color: '#0F172A',
                background: 'white', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Adult / Child toggle */}
          <div>
            <label style={{
              display: 'block', fontSize: '13px', fontWeight: '600',
              color: '#64748B', marginBottom: '8px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              Who is learning?
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { value: 'adult', icon: '👤', label: 'Adult' },
                { value: 'child', icon: '🧒', label: 'Child' },
              ].map(({ value, icon, label }) => {
                const active = type === value
                return (
                  <button
                    key={value}
                    onClick={() => setType(value)}
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
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          style={{
            width: '100%', padding: '15px',
            background: '#0891B2', border: 'none',
            borderRadius: '14px', cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '16px', fontWeight: '800', color: 'white',
            boxShadow: '0 4px 12px rgba(8,145,178,0.35)',
            transition: 'all 0.15s',
          }}
        >
          Start Learning →
        </button>
      </div>
    </div>
  )
}
