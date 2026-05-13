import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from '../i18n/translations'

const CATEGORIES = [
  { id: 'animals',    name: 'Animals',   emoji: '🐾', count: 45, bg: '#F0FDF4', color: '#16A34A' },
  { id: 'colors',     name: 'Colors',     emoji: '🎨', count: 36, bg: '#FDF4FF', color: '#9333EA' },
  { id: 'numbers',    name: 'Numbers',     emoji: '🔢', count: 29, bg: '#EFF6FF', color: '#2563EB' },
  { id: 'fruits',     name: 'Fruits',    emoji: '🍎', count: 36, bg: '#FFF7ED', color: '#EA580C' },
  { id: 'vegetables', name: 'Vegetables',    emoji: '🥕', count: 11, bg: '#F0FDF4', color: '#15803D' },
  { id: 'body',       name: 'Body',       emoji: '🫀', count: 18, bg: '#FDF2F8', color: '#DB2777' },
  { id: 'family',     name: 'Family',        emoji: '👨‍👩‍👧', count: 17, bg: '#FFF7ED', color: '#C2410C' },
  { id: 'school',     name: 'School',        emoji: '🏫', count: 18, bg: '#EFF6FF', color: '#1D4ED8' },
  { id: 'food',       name: 'Food',  emoji: '🍕', count: 22, bg: '#FEF9C3', color: '#A16207' },
  { id: 'greetings',  name: 'Greetings',   emoji: '👋', count: 15, bg: '#F0FDFA', color: '#0F766E' },
  { id: 'questions',  name: 'Questions',     emoji: '❓', count: 10, bg: '#F5F3FF', color: '#7C3AED' },
  { id: 'clothing',   name: 'Clothing',  emoji: '👗', count: 27, bg: '#FDF2F8', color: '#BE185D' },
  { id: 'home',       name: 'Home',          emoji: '🏠', count: 36, bg: '#F0FDF4', color: '#166534' },
  { id: 'transport',  name: 'Transport',      emoji: '🚗', count: 16, bg: '#EFF6FF', color: '#1E40AF' },
  { id: 'time',       name: 'Time',       emoji: '⏰', count: 37, bg: '#FFFBEB', color: '#B45309' },
  { id: 'jobs',       name: 'Jobs',   emoji: '👷', count: 21, bg: '#F8FAFC', color: '#475569' },
  { id: 'sports',     name: 'Sports',     emoji: '⚽', count: 15, bg: '#F0FDF4', color: '#15803D' },
  { id: 'places',     name: 'Places',      emoji: '📍', count: 29, bg: '#FEF2F2', color: '#DC2626' },
  { id: 'adjectives', name: 'Adjectives',    emoji: '✨', count: 50, bg: '#F5F3FF', color: '#6D28D9' },
  { id: 'verbs',      name: 'Verbs',     emoji: '🏃', count: 65, bg: '#FFF7ED', color: '#C2410C' },
]

export default function CategorySelect() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [hovered, setHovered] = useState(null)

  const profile = JSON.parse(localStorage.getItem('aguilang_active_profile') || '{}')
  const lang = JSON.parse(localStorage.getItem('aguilang_active_lang') || '{}')

  const savedCats = localStorage.getItem('aguilang_active_categories')
  const activeCats = savedCats ? JSON.parse(savedCats) : null

  const filtered = CATEGORIES
    .filter(c => activeCats === null || activeCats.includes(c.id))
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  const handleSelect = (cat) => {
    localStorage.setItem('aguilang_active_category', JSON.stringify(cat))
    navigate('/learn')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8FAFC',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #E2E8F0',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <button
              onClick={() => navigate('/language')}
              style={{
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ←
            </button>
            <div>
              <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>
                {lang.name || 'English'} · {profile.name || 'Aguila'}
              </div>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '20px',
                fontWeight: '800',
                color: '#0F172A',
              }}>
                {t('select category')}
              </div>
            </div>
          </div>

          {/* Arama */}
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '16px',
            }}>🔍</span>
            <input
              type="text"
              placeholder={t('search categories')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px 10px 38px',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none',
                fontFamily: 'Inter, sans-serif',
                background: '#F8FAFC',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '20px 24px 40px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '12px',
        }}>
          {filtered.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleSelect(cat)}
              onMouseEnter={() => setHovered(cat.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: hovered === cat.id ? cat.bg : 'white',
                border: `1.5px solid ${hovered === cat.id ? cat.color + '44' : '#E2E8F0'}`,
                borderRadius: '14px',
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                transform: hovered === cat.id ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: hovered === cat.id
                  ? `0 4px 12px ${cat.color}22`
                  : '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              <span style={{ fontSize: '32px', lineHeight: 1 }}>{cat.emoji}</span>
              <span style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '13px',
                fontWeight: '700',
                color: '#0F172A',
                textAlign: 'center',
              }}>
                {cat.name}
              </span>
              <span style={{
                fontSize: '11px',
                color: '#94A3B8',
                background: '#F1F5F9',
                borderRadius: '6px',
                padding: '2px 8px',
              }}>
                {cat.count} {t('words')}
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 0',
            color: '#94A3B8',
            fontSize: '15px',
          }}>
            No categories found for "{search}"
          </div>
        )}

        {/* Diyaloglar kartı */}
        <button
          onClick={() => navigate('/dialogue')}
          style={{
            width: '100%',
            marginTop: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'linear-gradient(135deg, #EFF8FF 0%, #E0F2FE 100%)',
            border: '1.5px solid #BAE6FD',
            borderRadius: '16px',
            padding: '18px 20px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'box-shadow 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(8,145,178,0.15)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
        >
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: '#0891B2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '26px', flexShrink: 0,
          }}>
            💬
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '16px', fontWeight: '800', color: '#0F172A',
            }}>
                Dialogues
            </div>
            <div style={{ fontSize: '13px', color: '#0891B2', marginTop: '2px', fontWeight: '500' }}>
                6 dialogue scenarios · Voice practice with TTS
            </div>
          </div>
          <div style={{ fontSize: '20px', color: '#0891B2' }}>›</div>
        </button>
      </div>
    </div>
  )
}