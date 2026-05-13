import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useParentControls, ENERGY_PRESETS, readSpeechQuiz } from '../../hooks/useParentControls'
import { useTranslation } from '../../i18n/translations'

// ── Constants ─────────────────────────────────────────────────────

const WEEKLY_PLAN_KEY = 'aguilang_weekly_plan'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const ALL_CATS = [
  { id: 'animals',    label: 'Animals',     emoji: '🐾' },
  { id: 'colors',     label: 'Colors',      emoji: '🎨' },
  { id: 'numbers',    label: 'Numbers',     emoji: '🔢' },
  { id: 'fruits',     label: 'Fruits',      emoji: '🍎' },
  { id: 'vegetables', label: 'Vegetables',  emoji: '🥦' },
  { id: 'body',       label: 'Body',        emoji: '🫀' },
  { id: 'family',     label: 'Family',      emoji: '👨‍👩‍👧' },
  { id: 'school',     label: 'School',      emoji: '🏫' },
  { id: 'food',       label: 'Food',        emoji: '🍽️' },
  { id: 'greetings',  label: 'Greetings',   emoji: '👋' },
  { id: 'questions',  label: 'Questions',   emoji: '❓' },
  { id: 'clothing',   label: 'Clothing',    emoji: '👕' },
  { id: 'home',       label: 'Home',        emoji: '🏠' },
  { id: 'transport',  label: 'Transport',   emoji: '🚗' },
  { id: 'time',       label: 'Time',        emoji: '⏰' },
  { id: 'jobs',       label: 'Jobs',        emoji: '💼' },
  { id: 'sports',     label: 'Sports',      emoji: '⚽' },
  { id: 'places',     label: 'Places',      emoji: '📍' },
  { id: 'adjectives', label: 'Adjectives',  emoji: '📝' },
  { id: 'verbs',      label: 'Verbs',       emoji: '🏃' },
]

const LANG_OPTIONS = [
  { id: 'en', label: 'English',    flag: '🇬🇧' },
  { id: 'es', label: 'Spanish',    flag: '🇪🇸' },
  { id: 'pt', label: 'Portuguese', flag: '🇧🇷' },
]

const ENERGY_OPTIONS = [
  { mode: 'low',    label: 'Low',      icon: '🌙', desc: `${ENERGY_PRESETS.low.cardLimit} cards · ${ENERGY_PRESETS.low.durationMinutes} min` },
  { mode: 'medium', label: 'Medium',   icon: '⚡', desc: `${ENERGY_PRESETS.medium.cardLimit} cards · ${ENERGY_PRESETS.medium.durationMinutes} min` },
  { mode: 'high',   label: 'High',     icon: '🔥', desc: `${ENERGY_PRESETS.high.cardLimit} cards · ${ENERGY_PRESETS.high.durationMinutes} min` },
  { mode: 'custom', label: 'Custom',   icon: '⚙️', desc: 'Customize' },
]

// ── Helpers ─────────────────────────────────────────────────────

function pad(n) { return String(n).padStart(2, '0') }

function loadWeeklyPlan() {
  try {
    const raw = localStorage.getItem(WEEKLY_PLAN_KEY)
    return raw
      ? JSON.parse(raw)
      : DAYS.map(day => ({ day, categoryId: 'animals', energy: 'medium' }))
  } catch {
    return DAYS.map(day => ({ day, categoryId: 'animals', energy: 'medium' }))
  }
}

// ── Style helpers ─────────────────────────────────────────────────

const card = {
  background: 'white',
  borderRadius: '14px',
  border: '1px solid #E2E8F0',
  padding: '20px',
  marginBottom: '14px',
}

const sectionTitle = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: '14px',
  fontWeight: '700',
  color: '#0F172A',
  marginBottom: '12px',
}

const saveBtn = {
  width: '100%',
  padding: '13px',
  background: '#0891B2',
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: '15px',
  fontWeight: '700',
  cursor: 'pointer',
  marginTop: '8px',
}

const Toggle = ({ on, onToggle }) => (
  <div
    onClick={onToggle}
    style={{
      width: '44px', height: '24px',
      borderRadius: '12px',
      background: on ? '#0891B2' : '#E2E8F0',
      position: 'relative',
      cursor: 'pointer',
      transition: 'background 0.2s',
      flexShrink: 0,
    }}
  >
    <div style={{
      width: '18px', height: '18px',
      borderRadius: '50%',
      background: 'white',
      position: 'absolute',
      top: '3px',
      left: on ? '23px' : '3px',
      transition: 'left 0.2s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    }} />
  </div>
)

// ── Main component ───────────────────────────────────────────────

const UI_LANG_OPTIONS = [
  { id: 'en', label: 'English', flag: '🇺🇸' },
  { id: 'es', label: 'Español', flag: '🇪🇸' },
  { id: 'pt', label: 'Português', flag: '🇧🇷' },
]

export default function ParentPanel() {
  const navigate = useNavigate()
  const { lang: currentUiLang, setLang } = useTranslation()

  const {
    langSettings,
    energyMode: energyData,
    activeCategories,
    timeSettings,
    vacationMode,
    notifSettings,
  } = useParentControls()

  const [activeTab, setActiveTab] = useState(1)
  const [savedMsg, setSavedMsg] = useState('')

  const [resetStep, setResetStep] = useState({})
  const [resetCatId, setResetCatId] = useState('animals')

  // Tab 2 — Controls
  const [localLangEnabled, setLocalLangEnabled] = useState(langSettings.enabled)
  const [localLangPriority, setLocalLangPriority] = useState(langSettings.priority)
  const [localEnergy, setLocalEnergy] = useState(energyData.mode)
  const [localCats, setLocalCats] = useState(activeCategories)
  const [localVacation, setLocalVacation] = useState(vacationMode.active)

  // Tab 3 — Plan
  const [weeklyPlan, setWeeklyPlan] = useState(loadWeeklyPlan)

  // Tab 4 — Session
  const [startTime, setStartTime] = useState(
    `${pad(timeSettings.startHour)}:${pad(timeSettings.startMin)}`
  )
  const [endTime, setEndTime] = useState(
    `${pad(timeSettings.endHour)}:${pad(timeSettings.endMin)}`
  )
  const [weekendOn, setWeekendOn] = useState(timeSettings.weekendEnabled)
  const [localNotifs, setLocalNotifs] = useState(notifSettings)
  const [speechQuizOn, setSpeechQuizOn] = useState(readSpeechQuiz())

  // ── Save ────────────────────────────────────────────────────────

  const showSaved = (msg) => {
    setSavedMsg(msg)
    setTimeout(() => setSavedMsg(''), 2500)
  }

  const saveControls = () => {
    localStorage.setItem('aguilang_lang_settings',
      JSON.stringify({ enabled: localLangEnabled, priority: localLangPriority }))
    localStorage.setItem('aguilang_energy_mode',
      JSON.stringify({ mode: localEnergy, custom: energyData.custom ?? ENERGY_PRESETS.medium }))
    localStorage.setItem('aguilang_active_categories', JSON.stringify(localCats))
    localStorage.setItem('aguilang_vacation_mode', JSON.stringify({ active: localVacation }))
    showSaved('Settings saved ✓')
  }

  const savePlan = () => {
    localStorage.setItem(WEEKLY_PLAN_KEY, JSON.stringify(weeklyPlan))
    showSaved('Weekly plan saved ✓')
  }

  const saveSession = () => {
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    localStorage.setItem('aguilang_time_settings',
      JSON.stringify({ startHour: sh, startMin: sm, endHour: eh, endMin: em, weekendEnabled: weekendOn }))
    localStorage.setItem('aguilang_notifications', JSON.stringify(localNotifs))
    localStorage.setItem('aguilang_speech_quiz', JSON.stringify(speechQuizOn))
    showSaved('Session settings saved ✓')
  }

  // ── Stats (Tab 1) ────────────────────────────────────────────────

  const profile = (() => {
    try { return JSON.parse(localStorage.getItem('aguilang_active_profile') || 'null') }
    catch { return null }
  })()

  const wordStats = (() => {
    try { return JSON.parse(localStorage.getItem('aguilang_word_stats') || '{}') }
    catch { return {} }
  })()

  const hardWords = Object.entries(wordStats)
    .filter(([, s]) => s.wrong >= 2)
    .sort((a, b) => b[1].wrong - a[1].wrong)
    .slice(0, 8)

  const totalSeen    = Object.values(wordStats).reduce((s, w) => s + (w.seen || 0), 0)
  const totalCorrect = Object.values(wordStats).reduce((s, w) => s + (w.correct || 0), 0)

  // ── Tab renderers ───────────────────────────────────────────────

  const renderStats = () => (
    <div>
      {/* Profile card */}
      {profile ? (
        <div style={card}>
          <div style={sectionTitle}>👤 Active Profile</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: '#EFF8FF', display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '20px', fontWeight: '800', color: '#0891B2',
            }}>
              {profile.initial || profile.name?.[0] || '?'}
            </div>
            <div>
              <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '16px' }}>
                {profile.name || 'Unnamed'}
              </div>
              <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                🔥 {profile.streak || 0} day streak &nbsp;·&nbsp;
                ⭐ {profile.points || 0} pts &nbsp;·&nbsp;
                Level {profile.level || 1}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ ...card, textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
          No profile created yet.
        </div>
      )}

      {/* Word statistics */}
      <div style={card}>
        <div style={sectionTitle}>📊 Word Statistics</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Total Seen', value: totalSeen },
            { label: 'Correct',    value: totalCorrect },
            { label: 'Difficult',  value: hardWords.length },
          ].map((s, i) => (
            <div key={i} style={{
              background: '#F8FAFC', borderRadius: '10px',
              padding: '12px 8px', textAlign: 'center',
            }}>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '22px', fontWeight: '800', color: '#0F172A',
              }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {hardWords.length > 0 && (
          <>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', marginBottom: '8px' }}>
              ⚠️ Difficult words
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {hardWords.map(([id, s]) => (
                <div key={id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#FFF7ED', borderRadius: '8px', padding: '8px 12px',
                  border: '1px solid #FED7AA',
                }}>
                  <span style={{ fontWeight: '700', color: '#9C4600', fontSize: '14px' }}>{id}</span>
                  <span style={{ fontSize: '12px', color: '#EF4444', fontWeight: '600' }}>
                    ❌ {s.wrong} wrong
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Weekly summary — hardcoded */}
      <div style={card}>
        <div style={sectionTitle}>📅 Weekly Summary</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => {
            const pct = [80, 100, 60, 40, 90][i]
            return (
              <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: '#94A3B8', width: '28px' }}>{day}</span>
                <div style={{ flex: 1, height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: '#0891B2', borderRadius: '4px' }} />
                </div>
                <span style={{ fontSize: '12px', color: '#64748B', width: '32px', textAlign: 'right' }}>
                  {pct}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  const renderControls = () => (
    <div>
      {/* UI Language switcher */}
      <div style={card}>
        <div style={sectionTitle}>🌍 App Language</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {UI_LANG_OPTIONS.map(({ id, label, flag }) => {
            const active = currentUiLang === id
            return (
              <button
                key={id}
                onClick={() => setLang(id)}
                style={{
                  flex: 1, padding: '10px 8px',
                  border: `2px solid ${active ? '#0891B2' : '#E2E8F0'}`,
                  borderRadius: '10px',
                  background: active ? '#EFF8FF' : 'white',
                  color: active ? '#0891B2' : '#94A3B8',
                  fontWeight: '700', fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{flag}</div>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Language control */}
      <div style={card}>
        <div style={sectionTitle}>🌐 Language</div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {LANG_OPTIONS.map(({ id, label, flag }) => {
            const enabled = localLangEnabled.includes(id)
            return (
              <button
                key={id}
                onClick={() => {
                  if (enabled && localLangEnabled.length <= 1) return
                  setLocalLangEnabled(prev =>
                    enabled ? prev.filter(l => l !== id) : [...prev, id]
                  )
                }}
                style={{
                  flex: 1, padding: '10px 8px',
                  border: `2px solid ${enabled ? '#0891B2' : '#E2E8F0'}`,
                  borderRadius: '10px',
                  background: enabled ? '#EFF8FF' : 'white',
                  color: enabled ? '#0891B2' : '#94A3B8',
                  fontWeight: '700', fontSize: '13px',
                  cursor: localLangEnabled.length === 1 && enabled ? 'not-allowed' : 'pointer',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{flag}</div>
                {label}
              </button>
            )
          })}
        </div>

        <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', marginBottom: '8px' }}>
          Priority language
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {LANG_OPTIONS.filter(l => localLangEnabled.includes(l.id)).map(({ id, label, flag }) => (
            <label key={id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '10px',
              border: `1.5px solid ${localLangPriority === id ? '#0891B2' : '#E2E8F0'}`,
              background: localLangPriority === id ? '#EFF8FF' : 'white',
              cursor: 'pointer',
            }}>
              <input
                type="radio"
                name="lang-priority"
                value={id}
                checked={localLangPriority === id}
                onChange={() => setLocalLangPriority(id)}
                style={{ accentColor: '#0891B2' }}
              />
              <span style={{ fontSize: '18px' }}>{flag}</span>
              <span style={{ fontWeight: '600', color: '#0F172A', fontSize: '14px' }}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Energy level */}
      <div style={card}>
        <div style={sectionTitle}>⚡ Energy Level</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {ENERGY_OPTIONS.map(({ mode, label, icon, desc }) => {
            const active = localEnergy === mode
            return (
              <button
                key={mode}
                onClick={() => setLocalEnergy(mode)}
                style={{
                  padding: '14px 12px', textAlign: 'left',
                  border: `2px solid ${active ? '#0891B2' : '#E2E8F0'}`,
                  borderRadius: '12px',
                  background: active ? '#EFF8FF' : 'white',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '22px', marginBottom: '4px' }}>{icon}</div>
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '14px', fontWeight: '700',
                  color: active ? '#0891B2' : '#0F172A',
                }}>{label}</div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active categories */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={sectionTitle}>📚 Active Categories</div>
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>
            {localCats.length}/20 selected
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          {ALL_CATS.map(({ id, label, emoji }) => {
            const checked = localCats.includes(id)
            return (
              <label key={id} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 10px', borderRadius: '8px',
                border: `1px solid ${checked ? '#BAE6FD' : '#E2E8F0'}`,
                background: checked ? '#F0F9FF' : 'white',
                cursor: localCats.length <= 3 && checked ? 'not-allowed' : 'pointer',
                fontSize: '13px',
              }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    if (checked && localCats.length <= 3) return
                    setLocalCats(prev =>
                      checked ? prev.filter(c => c !== id) : [...prev, id]
                    )
                  }}
                  style={{ accentColor: '#0891B2', flexShrink: 0 }}
                />
                <span>{emoji}</span>
                <span style={{ fontWeight: checked ? '600' : '400', color: checked ? '#0F172A' : '#64748B' }}>
                  {label}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Vacation mode */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '14px' }}>🏖️ Vacation Mode</div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
              Disables time restrictions
            </div>
          </div>
          <Toggle on={localVacation} onToggle={() => setLocalVacation(v => !v)} />
        </div>
      </div>

      <button onClick={saveControls} style={saveBtn}>Save</button>
    </div>
  )

  const renderPlan = () => {
    const savedCatIds = (() => {
      try {
        const raw = localStorage.getItem('aguilang_active_categories')
        return raw ? JSON.parse(raw) : null
      } catch { return null }
    })()
    const activePlanCats = savedCatIds
      ? ALL_CATS.filter(c => savedCatIds.includes(c.id))
      : ALL_CATS
    const fallbackCatId = activePlanCats[0]?.id ?? 'animals'

    return (
    <div>
      <div style={card}>
        <div style={sectionTitle}>📅 Weekly Learning Plan</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {weeklyPlan.map((entry, i) => {
            const effectiveCatId = activePlanCats.some(c => c.id === entry.categoryId)
              ? entry.categoryId
              : fallbackCatId
            return (
            <div key={entry.day} style={{
              padding: '12px', borderRadius: '10px',
              border: '1px solid #E2E8F0', background: '#F8FAFC',
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748B', marginBottom: '8px' }}>
                {entry.day}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={effectiveCatId}
                  onChange={e => {
                    const next = [...weeklyPlan]
                    next[i] = { ...next[i], categoryId: e.target.value }
                    setWeeklyPlan(next)
                  }}
                  style={{
                    flex: 2, padding: '8px', borderRadius: '8px',
                    border: '1px solid #E2E8F0', fontSize: '13px',
                    background: 'white', color: '#0F172A',
                  }}
                >
                  {activePlanCats.map(c => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                  ))}
                </select>
                <select
                  value={entry.energy}
                  onChange={e => {
                    const next = [...weeklyPlan]
                    next[i] = { ...next[i], energy: e.target.value }
                    setWeeklyPlan(next)
                  }}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px',
                    border: '1px solid #E2E8F0', fontSize: '13px',
                    background: 'white', color: '#0F172A',
                  }}
                >
                  <option value="low">🌙 Low</option>
                  <option value="medium">⚡ Medium</option>
                  <option value="high">🔥 High</option>
                </select>
              </div>
            </div>
            )
          })}
        </div>
      </div>
      <button onClick={savePlan} style={saveBtn}>Save</button>
    </div>
  )
  }

  const renderSession = () => (
    <div>
      {/* Study hours */}
      <div style={card}>
        <div style={sectionTitle}>🕐 Study Hours</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '6px', fontWeight: '600' }}>
              Start
            </div>
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px',
                border: '1.5px solid #E2E8F0', borderRadius: '10px',
                fontSize: '16px', fontWeight: '600', color: '#0F172A',
                background: 'white', boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '6px', fontWeight: '600' }}>
              End
            </div>
            <input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px',
                border: '1.5px solid #E2E8F0', borderRadius: '10px',
                fontSize: '16px', fontWeight: '600', color: '#0F172A',
                background: 'white', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '14px' }}>
              Weekend
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
              Study on Saturday and Sunday
            </div>
          </div>
          <Toggle on={weekendOn} onToggle={() => setWeekendOn(v => !v)} />
        </div>
      </div>

      {/* Notifications */}
      <div style={card}>
        <div style={sectionTitle}>🔔 Notifications</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            { key: 'onComplete',    label: 'Lesson Completed',  desc: 'Notification after each lesson' },
            { key: 'streakWarning', label: 'Streak Warning',    desc: 'When your streak is at risk' },
            { key: 'weeklyReport',  label: 'Weekly Report',     desc: 'Summary report on Sunday' },
          ].map(({ key, label, desc }) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '600', color: '#0F172A', fontSize: '14px' }}>{label}</div>
                <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{desc}</div>
              </div>
              <Toggle
                on={localNotifs[key]}
                onToggle={() => setLocalNotifs(prev => ({ ...prev, [key]: !prev[key] }))}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Quiz Settings */}
      <div style={card}>
        <div style={sectionTitle}>🎤 Quiz Settings</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '600', color: '#0F172A', fontSize: '14px' }}>
              Voice Pronunciation
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
              1 voice question every 5 questions
            </div>
          </div>
          <Toggle on={speechQuizOn} onToggle={() => setSpeechQuizOn(v => !v)} />
        </div>
      </div>

      <button onClick={saveSession} style={saveBtn}>Save</button>
    </div>
  )

  // ── Reset ─────────────────────────────────────────────────────────

  const recordReset = (label) => {
    const now = new Date().toLocaleString('en-US')
    setSavedMsg(`✅ Reset — ${now}`)
    localStorage.setItem('aguilang_last_reset', JSON.stringify({ label, time: now }))
    setResetStep({})
    window.dispatchEvent(new Event('wordStatsUpdated'))
    setTimeout(() => setSavedMsg(''), 3500)
  }

  const handleCategoryReset = async () => {
    const lang = (() => {
      try { return JSON.parse(localStorage.getItem('aguilang_active_lang') || '{"id":"en"}') }
      catch { return { id: 'en' } }
    })()
    try {
      const m = await import(`../../data/${resetCatId}-a1.json`)
      const words = m.default.translations?.[lang.id]?.words ?? []
      const wordIds = new Set(words.map(w => w.id))
      const stats = JSON.parse(localStorage.getItem('aguilang_word_stats') || '{}')
      wordIds.forEach(id => { delete stats[id] })
      localStorage.setItem('aguilang_word_stats', JSON.stringify(stats))
      recordReset(`${resetCatId} category`)
    } catch { /* skip */ }
  }

  const renderReset = () => (
    <div>
      {/* Quiz statistics */}
      <div style={card}>
        <div style={sectionTitle}>📊 Reset Quiz Statistics</div>
        <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '12px' }}>
          All word correct/wrong records will be deleted.
        </div>
        {resetStep.word !== 1 ? (
          <button
            onClick={() => setResetStep(s => ({ ...s, word: 1 }))}
            style={{ ...saveBtn, background: '#F1F5F9', color: '#475569' }}
          >
            Reset
          </button>
        ) : (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#DC2626', marginBottom: '10px' }}>
              ⚠️ All word statistics will be deleted. Are you sure?
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setResetStep({})} style={{ flex: 1, padding: '9px', background: '#F1F5F9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#475569' }}>Cancel</button>
              <button onClick={() => { localStorage.setItem('aguilang_word_stats', '{}'); recordReset('Quiz statistics') }} style={{ flex: 1, padding: '9px', background: '#EF4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', color: 'white' }}>Yes, Delete</button>
            </div>
          </div>
        )}
      </div>

      {/* Daily statistics */}
      <div style={card}>
        <div style={sectionTitle}>📅 Reset Daily Statistics</div>
        <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '12px' }}>
          Daily progress records will be deleted.
        </div>
        {resetStep.daily !== 1 ? (
          <button onClick={() => setResetStep(s => ({ ...s, daily: 1 }))} style={{ ...saveBtn, background: '#F1F5F9', color: '#475569' }}>
            Reset
          </button>
        ) : (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#DC2626', marginBottom: '10px' }}>
              ⚠️ Daily progress records will be deleted. Are you sure?
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setResetStep({})} style={{ flex: 1, padding: '9px', background: '#F1F5F9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#475569' }}>Cancel</button>
              <button onClick={() => { localStorage.setItem('aguilang_daily_stats', '{}'); recordReset('Daily statistics') }} style={{ flex: 1, padding: '9px', background: '#EF4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', color: 'white' }}>Yes, Delete</button>
            </div>
          </div>
        )}
      </div>

      {/* Reset by category */}
      <div style={card}>
        <div style={sectionTitle}>📚 Reset by Category</div>
        <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '12px' }}>
          Word statistics for the selected category will be deleted.
        </div>
        <select
          value={resetCatId}
          onChange={e => { setResetCatId(e.target.value); setResetStep(s => ({ ...s, cat: 0 })) }}
          style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', background: 'white', color: '#0F172A', marginBottom: '10px' }}
        >
          {ALL_CATS.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
        </select>
        {resetStep.cat !== 1 ? (
          <button onClick={() => setResetStep(s => ({ ...s, cat: 1 }))} style={{ ...saveBtn, background: '#F1F5F9', color: '#475569' }}>
            Reset
          </button>
        ) : (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#DC2626', marginBottom: '10px' }}>
              ⚠️ All word data for this category will be deleted. Are you sure?
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setResetStep({})} style={{ flex: 1, padding: '9px', background: '#F1F5F9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#475569' }}>Cancel</button>
              <button onClick={handleCategoryReset} style={{ flex: 1, padding: '9px', background: '#EF4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', color: 'white' }}>Yes, Delete</button>
            </div>
          </div>
        )}
      </div>

      {/* Reset all progress — double confirm */}
      <div style={{ ...card, border: '1.5px solid #FECACA' }}>
        <div style={{ ...sectionTitle, color: '#DC2626' }}>🗑️ Reset All Progress</div>
        <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '12px' }}>
          Word statistics, daily progress, active category and language settings will be deleted. Cannot be undone!
        </div>
        {!resetStep.all ? (
          <button onClick={() => setResetStep(s => ({ ...s, all: 1 }))} style={{ ...saveBtn, background: '#FEF2F2', color: '#DC2626', border: '1.5px solid #FECACA' }}>
            Reset All Data
          </button>
        ) : resetStep.all === 1 ? (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#DC2626', marginBottom: '10px' }}>
              ⚠️ This cannot be undone. Are you sure you want to continue?
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setResetStep({})} style={{ flex: 1, padding: '9px', background: '#F1F5F9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#475569' }}>Cancel</button>
              <button onClick={() => setResetStep(s => ({ ...s, all: 2 }))} style={{ flex: 1, padding: '9px', background: '#F97316', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', color: 'white' }}>Continue</button>
            </div>
          </div>
        ) : (
          <div style={{ background: '#FEF2F2', border: '2px solid #EF4444', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#DC2626', marginBottom: '10px' }}>
              🚨 Final step: All progress will be permanently deleted!
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setResetStep({})} style={{ flex: 1, padding: '9px', background: '#F1F5F9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#475569' }}>Cancel</button>
              <button
                onClick={() => {
                  localStorage.setItem('aguilang_word_stats', '{}')
                  localStorage.setItem('aguilang_daily_stats', '{}')
                  localStorage.removeItem('aguilang_active_category')
                  localStorage.removeItem('aguilang_active_lang')
                  recordReset('All progress')
                }}
                style={{ flex: 1, padding: '9px', background: '#EF4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', color: 'white' }}
              >
                Delete All Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────

  const TABS = [
    { id: 1, label: 'Stats',    icon: '📊' },
    { id: 2, label: 'Controls', icon: '🎛️' },
    { id: 3, label: 'Plan',     icon: '📅' },
    { id: 4, label: 'Session',  icon: '🕐' },
    { id: 5, label: 'Reset',    icon: '🗑️' },
  ]

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
        padding: '16px 20px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/settings')}
            style={{
              background: '#F1F5F9', border: 'none', borderRadius: '8px',
              width: '36px', height: '36px', cursor: 'pointer', fontSize: '16px',
              flexShrink: 0,
            }}
          >←</button>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '17px', fontWeight: '800', color: '#0F172A',
            }}>
              🔒 Settings
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: '#EFF8FF', border: '1px solid #BAE6FD', borderRadius: '8px',
              padding: '6px 12px', cursor: 'pointer',
              fontSize: '13px', fontWeight: '600', color: '#0891B2',
            }}
          >
            Exit
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #E2E8F0',
        padding: '0 20px',
      }}>
        <div style={{
          maxWidth: '640px', margin: '0 auto',
          display: 'flex', gap: '0',
        }}>
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                flex: 1, padding: '12px 4px',
                background: 'none', border: 'none',
                borderBottom: `2.5px solid ${activeTab === id ? '#0891B2' : 'transparent'}`,
                color: activeTab === id ? '#0891B2' : '#94A3B8',
                fontWeight: activeTab === id ? '700' : '500',
                fontSize: '12px', cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              }}
            >
              <span style={{ fontSize: '18px' }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Saved notification */}
      {savedMsg && (
        <div style={{
          background: '#F0FDF4', border: '1px solid #BBF7D0',
          color: '#15803D', padding: '10px 20px',
          textAlign: 'center', fontSize: '13px', fontWeight: '600',
        }}>
          {savedMsg}
        </div>
      )}

      {/* Content */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px' }}>
        {activeTab === 1 && renderStats()}
        {activeTab === 2 && renderControls()}
        {activeTab === 3 && renderPlan()}
        {activeTab === 4 && renderSession()}
        {activeTab === 5 && renderReset()}
      </div>
    </div>
  )
}
