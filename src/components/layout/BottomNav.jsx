import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from '../../i18n/translations'

export default function BottomNav() {
  const { pathname } = useLocation()
  const { t } = useTranslation()

  const tabs = [
    { to: '/dashboard',  label: t('dashboard'), icon: '🏠', match: ['/dashboard'] },
    { to: '/learn-hub',  label: t('learn'),     icon: '📚', match: ['/learn-hub', '/categories', '/learn', '/quiz', '/dialogue', '/grammar'] },
    { to: '/tictactoe',  label: t('games'),      icon: '🎮', match: ['/tictactoe'] },
    { to: '/dictionary', label: t('dictionary'), icon: '📖', match: ['/dictionary'] },
    { to: '/levels',     label: t('levels'),    icon: '🏆', match: ['/levels'] },
    { to: '/profile',    label: t('profile'),   icon: '👤', match: ['/profile'] },
    { to: '/setup',      label: t('change language'), icon: '🌐', match: ['/setup'] },
  ]

  const isActive = (match) => match.some(p => pathname === p || pathname.startsWith(p + '/'))

  return (
    <nav
      className="md:hidden flex items-center justify-around"
      style={{
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        height: '60px',
        flexShrink: 0,
        width: '100%',
        overflow: 'hidden',
      }}
    >
      {tabs.map(({ to, label, icon, match }) => {
        const active = isActive(match)
        return (
          <NavLink
            key={to}
            to={to}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '1px',
              padding: '4px 4px',
              fontSize: '9px', fontWeight: active ? '700' : '500',
              textDecoration: 'none',
              color: active ? '#0891B2' : '#94A3B8',
              position: 'relative',
              transition: 'color 0.15s',
              flex: 1, minWidth: 0, overflow: 'hidden',
            }}
          >
            {active && (
              <span style={{
                position: 'absolute', top: 0, left: '20%',
                width: '60%', height: '2px',
                background: '#0891B2', borderRadius: '0 0 2px 2px',
              }} />
            )}
            <span style={{ fontSize: '18px' }}>{icon}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
