import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../i18n/translations'

export default function LearnHub() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const lang     = JSON.parse(localStorage.getItem('aguilang_active_lang') || '{"id":"en"}')
  const category = JSON.parse(localStorage.getItem('aguilang_active_category') || '{}')

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 24px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '20px', fontWeight: '800', color: '#0F172A',
          }}>📖 {t('learn')}</div>
          <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
            {t('what do you want to study')}
          </div>
        </div>
      </div>

      {/* Kartlar */}
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '24px 24px 80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Kelimeler */}
        <button
          onClick={() => navigate('/categories')}
          style={{
            display: 'flex', alignItems: 'center', gap: '20px',
            background: 'white', border: '1.5px solid #BAE6FD',
            borderRadius: '20px', padding: '24px 22px',
            cursor: 'pointer', textAlign: 'left', width: '100%',
            boxShadow: '0 2px 12px rgba(8,145,178,0.08)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: '#EFF8FF', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '32px', flexShrink: 0,
          }}>📚</div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '18px', fontWeight: '800', color: '#0F172A',
            }}>{t('words')}</div>
            <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', lineHeight: '1.5' }}>
              {t('daily word cards and quiz')}
            </div>
            {category.name && (
              <div style={{
                marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '5px',
                background: '#EFF8FF', borderRadius: '8px', padding: '3px 10px',
                fontSize: '12px', fontWeight: '600', color: '#0891B2',
              }}>
                {category.emoji} {category.name}
              </div>
            )}
          </div>
          <div style={{ fontSize: '22px', color: '#0891B2', flexShrink: 0 }}>›</div>
        </button>

        {/* Gramer */}
        <button
          onClick={() => navigate('/grammar')}
          style={{
            display: 'flex', alignItems: 'center', gap: '20px',
            background: 'white', border: '1.5px solid #FDE68A',
            borderRadius: '20px', padding: '24px 22px',
            cursor: 'pointer', textAlign: 'left', width: '100%',
            boxShadow: '0 2px 12px rgba(245,158,11,0.08)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: '#FFFBEB', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '32px', flexShrink: 0,
          }}>📐</div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '18px', fontWeight: '800', color: '#0F172A',
            }}>{t('grammar')}</div>
            <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', lineHeight: '1.5' }}>
              {t('grammar lessons and exercises')}
            </div>
            <div style={{
              marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '5px',
              background: '#FFFBEB', borderRadius: '8px', padding: '3px 10px',
              fontSize: '12px', fontWeight: '600', color: '#92400E',
            }}>
              {lang.name || lang.id.toUpperCase()} · 6 lessons
            </div>
          </div>
          <div style={{ fontSize: '22px', color: '#F59E0B', flexShrink: 0 }}>›</div>
        </button>

        {/* Hızlı linkler */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button
            onClick={() => navigate('/dialogue')}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
              background: 'white', border: '1.5px solid #E2E8F0', borderRadius: '14px',
              padding: '16px 12px', cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '24px' }}>💬</span>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>{t('dialogues')}</div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>{t('conversation scenarios')}</div>
          </button>
          <button
            onClick={() => navigate('/quiz')}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
              background: 'white', border: '1.5px solid #E2E8F0', borderRadius: '14px',
              padding: '16px 12px', cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '24px' }}>🎯</span>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>{t('quiz')}</div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>{t('test your knowledge')}</div>
          </button>
        </div>
      </div>
    </div>
  )
}
