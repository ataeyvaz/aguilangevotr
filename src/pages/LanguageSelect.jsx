import { useNavigate } from 'react-router-dom'
import { setLang, getLang } from '../core/langState'
import { TARGET_LANGS, TARGET_LANG_IDS } from '../core/languages'

/**
 * LanguageSelect — Öğrenilecek hedef dili seç.
 * Kaynak dil TR (sabit, kilitli). Hedefler: EN / ES / PT / DE.
 * Seçim langState.setLang ile kaydedilir → tüm sayfalar takip eder.
 */
const COLORS = {
  en: { color: '#1D4ED8', bg: '#EFF6FF' },
  es: { color: '#DC2626', bg: '#FEF2F2' },
  pt: { color: '#059669', bg: '#F0FDF4' },
  de: { color: '#CA8A04', bg: '#FEFCE8' },
}

export default function LanguageSelect() {
  const navigate = useNavigate()
  const profile = (() => {
    try { return JSON.parse(localStorage.getItem('aguilang_active_profile') || '{}') }
    catch { return {} }
  })()
  const current = getLang()

  const handleSelect = (id) => {
    setLang(id)                 // çekirdek dili güncelle + aboneleri bilgilendir
    navigate('/categories')
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#F8FAFC',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'Inter, sans-serif',
    }}>
      {/* Başlık */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '40px', marginBottom: '8px' }}>👋</div>
        <h1 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '26px', fontWeight: '800', color: '#0F172A', margin: '0 0 6px',
        }}>
          Merhaba, {profile.name || 'Kartal'}!
        </h1>
        <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>
          Hangi dili öğrenmek istersin?
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Kaynak dil — kilitli */}
        <div style={label}>Ana Dilin</div>
        <div style={{
          width: '100%', background: '#F1F5F9', border: '1px solid #E2E8F0',
          borderRadius: '14px', padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px',
        }}>
          <div style={{ fontSize: '30px' }}>🇹🇷</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '16px', fontWeight: '700', color: '#64748B' }}>Türkçe</div>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>Türkçe</div>
          </div>
          <div style={{ fontSize: '16px' }}>🔒</div>
        </div>

        {/* Hedef diller */}
        <div style={label}>Öğrenilecek Dil</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {TARGET_LANG_IDS.map(id => {
            const lang = TARGET_LANGS[id]
            const c = COLORS[id] || COLORS.en
            const active = current === id
            return (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                style={{
                  width: '100%', background: 'white',
                  border: `2px solid ${active ? c.color : '#E2E8F0'}`,
                  borderRadius: '14px', padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: '16px',
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)', textAlign: 'left',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = c.color; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = active ? c.color : '#E2E8F0'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{
                  width: '44px', height: '44px', borderRadius: '10px', background: c.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', flexShrink: 0,
                }}>{lang.flag}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>
                    {lang.label}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>{lang.native}</div>
                </div>
                {active
                  ? <div style={{ color: c.color, fontSize: '18px', fontWeight: 800 }}>✓</div>
                  : <div style={{ color: '#CBD5E1', fontSize: '18px' }}>›</div>}
              </button>
            )
          })}
        </div>
      </div>

      <button onClick={() => navigate('/dashboard')} style={{
        marginTop: '28px', background: 'none', border: 'none',
        color: '#94A3B8', fontSize: '13px', cursor: 'pointer',
      }}>
        ← Geri
      </button>
    </div>
  )
}

const label = {
  fontSize: '11px', fontWeight: '700', color: '#94A3B8',
  letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '4px',
}
