import { useNavigate } from 'react-router-dom'

const LANGUAGES = [
  {
    id: 'en',
    code: 'GB',
    name: 'English',
    native: 'English',
    flag: '/flags/gb.png',
    color: '#1D4ED8',
    bg: '#EFF6FF',
  },
  {
    id: 'es',
    code: 'ES',
    name: 'Spanish',
    native: 'Español',
    flag: '/flags/es.png',
    color: '#DC2626',
    bg: '#FEF2F2',
  },
  {
    id: 'pt',
    code: 'BR',
    name: 'Portuguese',
    native: 'Português',
    flag: 'https://flagcdn.com/w40/br.png',
    color: '#0EA5E9',
    bg: '#F0FDF4',
  },
]

export default function LanguageSelect() {
  const navigate = useNavigate()

  const profile = JSON.parse(
    localStorage.getItem('aguilang_active_profile') || '{}'
  )

  const nativeLangId = (() => {
    try {
      const ui = localStorage.getItem('aguilang_ui_language')
      if (ui) return JSON.parse(ui)
    } catch { /* ignore */ }
    return profile.speak_lang || 'en'
  })()

  const nativeLang = LANGUAGES.find(l => l.id === nativeLangId) ?? LANGUAGES[0]

  const visibleLangs = (() => {
    let base = LANGUAGES.filter(l => l.id !== nativeLangId)
    if (profile.type !== 'child') return base
    try {
      const saved = localStorage.getItem('aguilang_lang_settings')
      if (!saved) return base
      const { enabled = [], priority } = JSON.parse(saved)
      const filtered = base.filter(l => enabled.includes(l.id))
      if (!filtered.length) return base
      return [
        ...filtered.filter(l => l.id === priority),
        ...filtered.filter(l => l.id !== priority),
      ]
    } catch {
      return base
    }
  })()

  const handleSelect = (lang) => {
    localStorage.setItem('aguilang_active_lang', JSON.stringify(lang))
    navigate('/categories')
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
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '40px', marginBottom: '8px' }}>👋</div>
        <h1 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '26px',
          fontWeight: '800',
          color: '#0F172A',
          margin: '0 0 6px',
        }}>
          Hello, {profile.name || 'Aguila'}!
        </h1>
        <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>
          Which language do you want to learn?
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Source language - locked */}
        <div style={{
          fontSize: '11px',
          fontWeight: '700',
          color: '#94A3B8',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginBottom: '8px',
          paddingLeft: '4px',
        }}>
          Source Language
        </div>
        <div style={{
          width: '100%',
          background: '#F1F5F9',
          border: '1px solid #E2E8F0',
          borderRadius: '14px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: '#E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: '700',
            color: '#64748B',
            overflow: 'hidden',
          }}>
            <img
              src={nativeLang.flag}
              alt={nativeLang.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
              onError={e => {
                e.target.style.display = 'none'
                e.target.parentNode.textContent = nativeLang.code
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '16px',
              fontWeight: '700',
              color: '#64748B',
            }}>{nativeLang.name}</div>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>{nativeLang.native}</div>
          </div>
          <div style={{ fontSize: '16px' }}>🔒</div>
        </div>

        {/* Target languages */}
        <div style={{
          fontSize: '11px',
          fontWeight: '700',
          color: '#94A3B8',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginBottom: '8px',
          paddingLeft: '4px',
        }}>
          Language to Learn
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {visibleLangs.map(lang => (
            <button
              key={lang.id}
              onClick={() => handleSelect(lang)}
              style={{
                width: '100%',
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                textAlign: 'left',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = lang.color
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = `0 4px 12px ${lang.color}22`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#E2E8F0'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
              }}
            >
              {/* Flag */}
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: lang.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: '700',
                color: lang.color,
                flexShrink: 0,
                overflow: 'hidden',
              }}>
                <img
                  src={lang.flag}
                  alt={lang.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                  onError={e => {
                    e.target.style.display = 'none'
                    e.target.parentNode.textContent = lang.code
                  }}
                />
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#0F172A',
                  marginBottom: '2px',
                }}>
                  {lang.name}
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                  {lang.native}
                </div>
              </div>

              {/* Arrow */}
              <div style={{ color: '#CBD5E1', fontSize: '18px' }}>›</div>
            </button>
          ))}
        </div>
      </div>

      {/* Back */}
      <button
        onClick={() => navigate('/')}
        style={{
          marginTop: '28px',
          background: 'none',
          border: 'none',
          color: '#94A3B8',
          fontSize: '13px',
          cursor: 'pointer',
        }}
      >
        ← Go Back
      </button>
    </div>
  )
}