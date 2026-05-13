import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPreparedQuestions } from '../data/placementQuestionsENES'
import { useTranslation } from '../i18n/translations'

// ── Seviye hesapla (%70+ → A2) ────────────────────────────
function computeLevel(correct, total) {
  const pct = (correct / total) * 100
  return pct >= 70 ? 'A2' : 'A1'
}

// ── Sonucu kaydet (localStorage — TODO: DB bridge) ────────
function saveResult(correct, total, answers) {
  // TODO (Electron/Capacitor): import { savePlacementResult } from '../db/placementQueries.js'
  // savePlacementResult(profileId, pairId, answers)
  const level = computeLevel(correct, total)
  const score = Math.round((correct / total) * 100)
  const result = { level, score, correct, total, takenAt: new Date().toISOString(), answers }

  // Profile'a seviyeyi yaz
  try {
    const profile = JSON.parse(localStorage.getItem('aguilang_active_profile') || '{}')
    profile.current_level   = level
    profile.placement_done  = true
    localStorage.setItem('aguilang_active_profile', JSON.stringify(profile))
  } catch { /* ignore */ }

  localStorage.setItem('aguilang_placement_result', JSON.stringify(result))
  return result
}

// ── Level Badge renkleri ──────────────────────────────────
const LEVEL_COLORS = {
  A1: { bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-700',  badge: 'bg-blue-600'  },
  A2: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', badge: 'bg-violet-600' },
}

// ─────────────────────────────────────────────────────────
export default function PlacementTest() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  // Questions prepared once on mount (including shuffle)
  const questions = useMemo(() => getPreparedQuestions(), [])
  const TOTAL     = questions.length

  const [phase,        setPhase]        = useState('intro')   // intro | question | result
  const [current,      setCurrent]      = useState(0)
  const [selected,     setSelected]     = useState(null)      // seçilen option index
  const [answers,      setAnswers]      = useState([])        // [{id, chosen, correct}]
  const [result,       setResult]       = useState(null)

  const q = questions[current]

  // ── Cevap seçildi ─────────────────────────────────────
  const handleSelect = useCallback((optionIndex) => {
    if (selected !== null) return   // zaten cevaplandı
    setSelected(optionIndex)
  }, [selected])

  // ── Next butonu ────────────────────────────────────────
  const handleNext = useCallback(() => {
    const isCorrect = selected === q.correctIndex
    const newAnswers = [
      ...answers,
      { id: q.id, chosen: q.options[selected], correct: isCorrect },
    ]
    setAnswers(newAnswers)

    if (current + 1 < TOTAL) {
      setCurrent(c => c + 1)
      setSelected(null)
    } else {
      const correct = newAnswers.filter(a => a.correct).length
      const r = saveResult(correct, TOTAL, newAnswers)
      setResult(r)
      setPhase('result')
    }
  }, [selected, q, answers, current, TOTAL])

  // ─── INTRO SCREEN ──────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 font-sans">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="text-center mb-10">
            <div className="text-6xl mb-3">🦅</div>
            <h1 className="font-bold text-3xl text-slate-900 mb-1"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {t('placement test')}
            </h1>
            <p className="text-slate-500 text-sm">Find your English level</p>
          </div>

          {/* Info card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-4">
            <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100">
              <span className="text-3xl">🇪🇸</span>
              <div>
                <div className="font-bold text-slate-800 text-base">Spanish → English</div>
                <div className="text-slate-400 text-xs">EN ↔ ES</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { icon: '📝', label: `${TOTAL} questions` },
                { icon: '⏱️', label: '~5 minutes' },
                { icon: '🎯', label: 'A1 / A2' },
              ].map(({ icon, label }) => (
                <div key={label} className="bg-slate-50 rounded-xl py-3 px-2">
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-xs font-semibold text-slate-600">{label}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-amber-800 text-xs font-medium leading-relaxed">
                ⚠️ Answer all questions in one session.
                You cannot go back once you start.
              </p>
            </div>
          </div>

          <button
            onClick={() => setPhase('question')}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800
                       text-white font-bold text-lg rounded-2xl transition-colors
                       shadow-lg shadow-cyan-600/30"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {t('start test')} →
          </button>
        </div>
      </div>
    )
  }

  // ─── RESULT SCREEN ─────────────────────────────────────
  if (phase === 'result' && result) {
    const colors = LEVEL_COLORS[result.level]
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 font-sans">
        <div className="w-full max-w-md">

          {/* Level badge */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Your Level
            </h2>

            <div className={`inline-flex items-center justify-center
                            w-32 h-32 rounded-full ${colors.badge}
                            shadow-xl mb-4`}>
              <span className="text-white font-black text-4xl"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {result.level}
              </span>
            </div>

            <div className="text-slate-500 text-sm mt-3">
              {result.level === 'A2'
                ? 'Elementary — you know the basics!'
                : 'Beginner — great starting point!'}
            </div>
          </div>

          {/* Score card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-4">
            <div className="grid grid-cols-3 gap-4 text-center mb-5">
              <div>
                <div className="text-3xl font-black text-slate-900"
                     style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {result.correct}/{result.total}
                </div>
                <div className="text-xs text-slate-400 mt-1">Correct</div>
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900"
                     style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {result.score}%
                </div>
                <div className="text-xs text-slate-400 mt-1">Score</div>
              </div>
              <div>
                <div className={`text-3xl font-black ${colors.text}`}
                     style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {result.level}
                </div>
                <div className="text-xs text-slate-400 mt-1">Level</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${colors.badge} transition-all`}
                style={{ width: `${result.score}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-slate-400">
              <span>0%</span>
              <span className="font-semibold text-slate-600">70% → A2</span>
              <span>100%</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800
                       text-white font-bold text-lg rounded-2xl transition-colors
                       shadow-lg shadow-cyan-600/30"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {t('start learning')} →
          </button>
        </div>
      </div>
    )
  }

  // ─── QUESTION SCREEN ───────────────────────────────────
  const progress    = ((current) / TOTAL) * 100
  const isAnswered  = selected !== null
  const isCorrect   = selected === q.correctIndex

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col px-6 pt-8 pb-6 font-sans">
      <div className="w-full max-w-md mx-auto flex flex-col flex-1">

        {/* Header: progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              {q.skill_area}
            </span>
            <span className="text-sm font-bold text-slate-600">
              {current + 1} / {TOTAL}
            </span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-slate-400">
            <span>{q.cefr_level}</span>
            <span>{TOTAL - current - 1} left</span>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-5">
          <p className="text-slate-900 font-semibold text-lg leading-snug"
             style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {q.question}
          </p>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3 flex-1">
          {q.options.map((option, idx) => {
            const isSelected  = selected === idx
            const isRight     = idx === q.correctIndex
            let btnClass = 'w-full p-4 rounded-xl border-2 text-left font-semibold text-sm transition-all duration-200 cursor-pointer '

            if (!isAnswered) {
              btnClass += 'bg-white border-slate-200 text-slate-700 hover:border-cyan-400 hover:bg-cyan-50'
            } else if (isRight) {
              btnClass += 'bg-emerald-50 border-emerald-400 text-emerald-800'
            } else if (isSelected && !isRight) {
              btnClass += 'bg-red-50 border-red-400 text-red-800'
            } else {
              btnClass += 'bg-white border-slate-100 text-slate-400 opacity-60'
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={isAnswered}
                className={btnClass}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <span className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center
                                   text-xs font-bold text-slate-500 shrink-0">
                    {['A', 'B', 'C', 'D'][idx]}
                  </span>
                  <span>{option}</span>
                  {isAnswered && isRight && <span className="ml-auto">✅</span>}
                  {isAnswered && isSelected && !isRight && <span className="ml-auto">❌</span>}
                </span>
              </button>
            )
          })}
        </div>

        {/* Feedback + Next */}
        {isAnswered && (
          <div className="mt-5">
            <div className={`rounded-xl p-3 mb-4 text-sm font-semibold
              ${isCorrect ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {isCorrect
                ? '✅ Correct! Well done.'
                : `❌ Incorrect. Correct answer: "${q.options[q.correctIndex]}"`}
            </div>

            <button
              onClick={handleNext}
              className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800
                         text-white font-bold text-base rounded-2xl transition-colors"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {current + 1 < TOTAL ? 'Next Question →' : 'See Results →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
