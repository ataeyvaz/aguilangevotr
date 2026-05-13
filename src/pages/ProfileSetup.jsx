import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useTranslation } from '../i18n/translations'

// ── Sabitler ───────────────────────────────────────────────

// TR önce — varsayılan kaynak dil
const SPEAK_LANGS = [
  { code: 'tr', flag: '🇹🇷', name: 'Türkçe' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'pt', flag: '🇧🇷', name: 'Português' },
  { code: 'en', flag: '🇺🇸', name: 'English' },
]

// Tüm hedef dil seçenekleri
const LEARN_OPTIONS = [
  { code: 'en', flag: '🇺🇸', name: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'pt', flag: '🇧🇷', name: 'Português' },
]

const AGE_MODES = [
  { value: 'adult', icon: '👤' },
  { value: 'child', icon: '👦' },
]

const PROFILE_KEY = 'aguilang_active_profile'

// speakLang + learnLang → language_pairs.id
// TR→EN=5, TR→ES=6, TR→PT=7 | EN→ES=1, EN→PT=2 | ES→EN=3 | PT→EN=4
function getPairId(speakLang, learnLang) {
  if (speakLang === 'tr' && learnLang === 'en') return 5
  if (speakLang === 'tr' && learnLang === 'es') return 6
  if (speakLang === 'tr' && learnLang === 'pt') return 7
  if (speakLang === 'en' && learnLang === 'es') return 1
  if (speakLang === 'en' && learnLang === 'pt') return 2
  if (speakLang === 'es' && learnLang === 'en') return 3
  if (speakLang === 'pt' && learnLang === 'en') return 4
  return 5
}

// ── Bileşen ────────────────────────────────────────────────

export default function ProfileSetup() {
  const navigate = useNavigate()
  const { saveProfile, setCurrentPair, uiLanguage, setUiLanguage } = useApp()
  const { t } = useTranslation()

  const existingProfile = (() => {
    try { const s = localStorage.getItem(PROFILE_KEY); return s ? JSON.parse(s) : null }
    catch { return null }
  })()
  const isReturning = !!(existingProfile?.placement_done)

  const [ageMode, setAgeMode] = useState(existingProfile?.type || 'adult')

  // learnLang: TR/ES/PT → 'en' sabit başlangıç; EN → 'es' başlangıç
  const [learnLang, setLearnLang] = useState(() => {
    if (existingProfile?.learn_lang) return existingProfile.learn_lang
    const lang = uiLanguage || 'tr'
    return lang === 'en' ? 'es' : 'en'
  })

  // "Konuştuğum dil" seçilince: UI dilini + learnLang'ı otomatik ayarla
  const handleSpeakSelect = (code) => {
    setUiLanguage(code)
    if (code === 'en') {
      setLearnLang(prev => (prev === 'en' ? 'es' : prev))
    } else {
      setLearnLang('en')
    }
  }

  const canStart = learnLang !== uiLanguage

  const handleStart = () => {
    if (!canStart) return
    const pairId = getPairId(uiLanguage, learnLang)
    setCurrentPair(pairId)

    const base = isReturning
      ? existingProfile
      : { name: 'Aguila', initial: 'A', points: 0, level: 1, streak: 0, placement_done: false, current_level: null }

    saveProfile({
      ...base,
      type:        ageMode,
      ui_language: uiLanguage,
      speak_lang:  uiLanguage,
      learn_lang:  learnLang,
      pair_id:     pairId,
    })
    navigate(isReturning ? '/dashboard' : '/placement-test')
  }

  // ── "Öğrenmek istediğim dil" bölümü ────────────────────

  const renderLearnSection = () => {
    // ES/PT konuşanlar → EN sabit
    if (uiLanguage === 'es' || uiLanguage === 'pt') {
      return (
        <div className="flex items-center gap-3 bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
          <span className="text-2xl">🇺🇸</span>
          <span className="font-bold text-slate-800 text-sm"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            English (US)
          </span>
          <span className="ml-auto text-cyan-600 text-sm font-bold">✓</span>
        </div>
      )
    }

    // TR konuşanlar → EN / ES / PT seçer
    // EN konuşanlar → ES / PT seçer
    const opts = uiLanguage === 'en'
      ? LEARN_OPTIONS.filter(o => o.code !== 'en')
      : LEARN_OPTIONS

    return (
      <div className="flex gap-2">
        {opts.map(({ code, flag, name }) => {
          const active = learnLang === code
          return (
            <button
              key={code}
              onClick={() => setLearnLang(code)}
              className={`flex-1 py-3 px-2 rounded-xl border-2 text-center transition-all
                ${active
                  ? 'bg-cyan-600 border-cyan-600 text-white shadow-md shadow-cyan-600/25'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-cyan-300'}`}
            >
              <div className="text-2xl mb-0.5">{flag}</div>
              <div className={`text-xs font-bold ${active ? 'text-white' : 'text-slate-600'}`}>
                {name}
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6"
         style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mb-3">
            <img src="/aguilapp.png" alt="AguiLangEvoTR" className="w-20 h-20 mx-auto object-contain" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-1"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            AguiLangEvoTR
          </h1>
          <p className="text-slate-500 text-sm">{t('lets get started')}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4 flex flex-col gap-6">

          {/* ── Konuştuğum dil ─────────────────────────────── */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              {t('i speak')}
            </p>
            <div className="flex gap-2">
              {SPEAK_LANGS.map(({ code, flag, name }) => {
                const active = uiLanguage === code
                return (
                  <button
                    key={code}
                    onClick={() => handleSpeakSelect(code)}
                    className={`flex-1 py-3 px-2 rounded-xl border-2 text-center transition-all
                      ${active
                        ? 'bg-cyan-600 border-cyan-600 text-white shadow-md shadow-cyan-600/25'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-cyan-300'}`}
                  >
                    <div className="text-2xl mb-0.5">{flag}</div>
                    <div className={`text-xs font-bold ${active ? 'text-white' : 'text-slate-600'}`}>
                      {name}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Öğrenmek istediğim dil ─────────────────────── */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              {t('i want to learn')}
            </p>
            {renderLearnSection()}

            {!canStart && (
              <p className="text-xs text-red-500 mt-2 font-medium">
                Kendi dilini öğrenemezsin!
              </p>
            )}
          </div>

          {/* ── Mod seç ────────────────────────────────────── */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              {t('choose your mode')}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {AGE_MODES.map(({ value, icon }) => {
                const active = ageMode === value
                const label  = value === 'adult' ? t('adult mode') : t('child mode')
                return (
                  <button
                    key={value}
                    onClick={() => setAgeMode(value)}
                    className={`p-4 rounded-xl border-2 text-center transition-all
                      ${active
                        ? 'bg-cyan-600 border-cyan-600 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-cyan-300'}`}
                  >
                    <div className="text-3xl mb-1">{icon}</div>
                    <div className="font-bold text-sm"
                         style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {label}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Başla ──────────────────────────────────────── */}
        <button
          onClick={handleStart}
          disabled={!canStart}
          className={`w-full py-4 text-white font-black text-lg rounded-2xl transition-colors
                     shadow-lg
                     ${canStart
                       ? 'bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 shadow-cyan-600/30'
                       : 'bg-slate-300 shadow-slate-300/30 cursor-not-allowed'}`}
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {t('lets go')} 🦅
        </button>

        <p className="text-center text-xs text-slate-400 mt-4">
          {t('change language')} → {t('profile')}
        </p>

        {isReturning && (
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-2 text-slate-400 hover:text-slate-600 text-sm transition-colors mt-1"
          >
            ← {t('dashboard')}
          </button>
        )}
      </div>
    </div>
  )
}
