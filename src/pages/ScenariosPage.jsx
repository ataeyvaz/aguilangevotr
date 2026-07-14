/**
 * ScenariosPage — Senaryo kataloğu (veri-güdümlü, çekirdeğe bağlı)
 * Senaryoları domaine göre gruplar, ScenarioRunner'a yönlendirir.
 */
import { useNavigate } from 'react-router-dom'
import { SCENARIOS, DOMAINS } from '../data/scenarios/index'
import { useLang } from '../core/langState'
import { TARGET_LANGS } from '../core/languages'
import { getDoneScenarios } from '../core/progressStore'

export default function ScenariosPage() {
  const navigate = useNavigate()
  const [lang] = useLang()
  const done = getDoneScenarios()
  const doneCount = SCENARIOS.filter(s => done[s.id]).length

  // domaine göre grupla
  const byDomain = {}
  for (const s of SCENARIOS) (byDomain[s.domain] ||= []).push(s)

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 20px',
                    position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/dashboard')} style={{
            background: '#F1F5F9', border: 'none', borderRadius: 8, width: 32, height: 32,
            cursor: 'pointer', fontSize: 16 }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>🎬 Senaryolar</div>
            <div style={{ fontSize: 13, color: '#94A3B8' }}>
              Türkçe → {TARGET_LANGS[lang]?.native} · {doneCount}/{SCENARIOS.length} tamamlandı
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 20px 48px', display: 'flex', flexDirection: 'column', gap: 26 }}>
        {Object.entries(byDomain).map(([domain, list]) => (
          <div key={domain}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#334155', marginBottom: 12,
                          display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>{DOMAINS[domain]?.emoji}</span>
              {DOMAINS[domain]?.label || domain}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
              {list.map(s => (
                <button key={s.id}
                  disabled={s.planned}
                  onClick={() => !s.planned && navigate(`/scenario?id=${s.id}`)}
                  style={{
                    position: 'relative', textAlign: 'left',
                    background: s.planned ? '#F8FAFC' : 'white',
                    border: '1px solid #E2E8F0', borderRadius: 16, padding: '16px 16px 14px',
                    cursor: s.planned ? 'default' : 'pointer', opacity: s.planned ? 0.6 : 1,
                    display: 'flex', flexDirection: 'column', gap: 8,
                    boxShadow: s.planned ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
                  }}>
                  {done[s.id] && (
                    <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 12, fontWeight: 800,
                                  color: 'white', background: '#16A34A', borderRadius: 999,
                                  width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
                  )}
                  <div style={{ fontSize: 30 }}>{s.emoji}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', lineHeight: 1.25 }}>{s.title}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#15803D',
                                   background: '#F0FDF4', border: '1px solid #BBF7D0',
                                   borderRadius: 6, padding: '2px 7px' }}>{s.level}</span>
                    {s.planned && <span style={{ fontSize: 11, color: '#94A3B8' }}>yakında</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
