import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllProgress } from '../hooks/useGrammar'
import { useTranslation } from '../i18n/translations'

const LESSON_META = [
  { en: 'Simple Present',   de: 'Präsens',              es: 'Presente',              icon: '⚡' },
  { en: 'am / is / are',    de: 'sein',                  es: 'ser / estar',           icon: '🔵' },
  { en: 'Do / Does soru',   de: 'W-Fragen',              es: 'Preguntas',             icon: '❓' },
  { en: "Don't / Doesn't",  de: 'Negation (nicht/kein)', es: 'No + fiil',             icon: '🚫' },
  { en: 'Where / When',     de: 'Wo / Wann',             es: 'Dónde / Cuándo',        icon: '📍' },
  { en: 'Did / Was / Were', de: 'Perfekt',               es: 'Pretérito Indefinido',  icon: '⏮️' },
]

export default function GrammarPage() {
  const navigate  = useNavigate()
  const { t } = useTranslation()
  const lang      = JSON.parse(localStorage.getItem('aguilang_active_lang') || '{"id":"en"}')
  const [summary, setSummary] = useState({ total: 6, completed: 0, lessons: [] })

  useEffect(() => {
    setSummary(getAllProgress(lang.id))
    const onUpdate = () => setSummary(getAllProgress(lang.id))
    window.addEventListener('grammarProgressUpdated', onUpdate)
    return () => window.removeEventListener('grammarProgressUpdated', onUpdate)
  }, [lang.id])

  const handleLesson = (lessonNumber, progress) => {
    const lessonId = `${lang.id}-lesson-${lessonNumber}`
    navigate(`/grammar/${lessonId}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 24px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '20px', fontWeight: '800', color: '#0F172A',
          }}>📐 Grammar</div>
          <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
            {summary.completed} / {summary.total} {t('lessons completed')}
          </div>
        </div>
      </div>

      {/* İlerleme çubuğu */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 24px 14px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(summary.completed / summary.total) * 100}%`,
              background: '#0891B2', borderRadius: '3px', transition: 'width 0.4s',
            }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '20px 24px 80px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {LESSON_META.map((meta, i) => {
            const lessonNumber = i + 1
            const lessonId     = `${lang.id}-lesson-${lessonNumber}`
            const prog         = summary.lessons[i] || { completed: false, currentStep: 0 }
            const subtitle     = meta[lang.id] || meta.en
            const isCompleted  = prog.completed
            const inProgress   = !isCompleted && prog.currentStep > 0

            return (
              <div
                key={lessonId}
                style={{
                  background: 'white',
                  border: `1.5px solid ${isCompleted ? '#86EFAC' : '#E2E8F0'}`,
                  borderRadius: '16px',
                  padding: '16px 18px',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  boxShadow: isCompleted ? '0 2px 8px rgba(134,239,172,0.2)' : '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                {/* İkon */}
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
                  background: isCompleted ? '#F0FDF4' : '#EFF8FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
                }}>
                  {isCompleted ? '✅' : meta.icon}
                </div>

                {/* Bilgi */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '12px', fontWeight: '700', color: '#94A3B8',
                    }}>{t('lesson').toUpperCase()} {lessonNumber}</div>
                    {isCompleted && (
                      <div style={{
                        fontSize: '10px', fontWeight: '700', color: '#15803D',
                        background: '#DCFCE7', borderRadius: '6px', padding: '2px 7px',
                      }}>{t('lesson completed')}</div>
                    )}
                    {inProgress && !isCompleted && (
                      <div style={{
                        fontSize: '10px', fontWeight: '700', color: '#92400E',
                        background: '#FEF3C7', borderRadius: '6px', padding: '2px 7px',
                      }}>In Progress</div>
                    )}
                  </div>
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '15px', fontWeight: '800', color: '#0F172A', marginTop: '2px',
                  }}>{subtitle}</div>
                  {inProgress && (
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                      Step {prog.currentStep + 1} / 4
                    </div>
                  )}
                </div>

                {/* Buton */}
                <button
                  onClick={() => handleLesson(lessonNumber, prog)}
                  style={{
                    padding: '8px 16px',
                    background: isCompleted ? '#F0FDF4' : inProgress ? '#FFFBEB' : '#0891B2',
                    color: isCompleted ? '#15803D' : inProgress ? '#92400E' : 'white',
                    border: `1.5px solid ${isCompleted ? '#86EFAC' : inProgress ? '#FDE68A' : 'transparent'}`,
                    borderRadius: '10px', fontSize: '13px', fontWeight: '700',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {isCompleted ? '🔄 Repeat' : inProgress ? '▶ Continue' : `${t('start')} →`}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
