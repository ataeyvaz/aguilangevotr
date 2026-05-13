/**
 * Practice.jsx — Conversation Practice ekranı
 *
 * URL: /practice?word=run&difficulty=easy
 *
 * Akış: Intro → Exchange(0..N-1) → Özet
 *
 * Modlar: Pick (10 pts) | Type (12 pts) | Speak (15 pts)
 */

import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from '../i18n/translations'
import { useSpeech } from '../hooks/useSpeech'
import { checkAnswer, findBestOption, getPronunciationScore } from '../utils/fuzzyMatch'
import {
  getPackForWord,
  getExchanges,
  saveConvProgress,
  saveSession,
  getConvProgress,
  getAvailableDifficulties,
  getAllPackWords,
} from '../services/conversationService'

// ── Sabitler ─────────────────────────────────────────────────

const DIFF_META = {
  easy:   { label: 'Easy',   emoji: '🟢', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  medium: { label: 'Medium', emoji: '🟡', bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-300'   },
  hard:   { label: 'Hard',   emoji: '🔴', bg: 'bg-red-100',     text: 'text-red-700',     border: 'border-red-300'     },
}

const NEXT_DIFF = { easy: 'medium', medium: 'hard' }

// Mod puanları
const MODE_POINTS = {
  pick: 10,
  type: 12,
  speak: 15,
}

// Mod ikonları
const MODE_ICONS = {
  pick: '👆',
  type: '⌨️',
  speak: '🎤',
}

// ── MD5 Hash Fonksiyonu (basit implementasyon) ───────────────

function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

function getMessageHash(message) {
  return simpleHash(message)
}

// ── Ses dosyası path'ini hesapla ──────────────────────────────

function getAudioPath(botMessage, botLanguage) {
  if (!botMessage || !botLanguage) return null
  const hash = getMessageHash(botMessage)
  return `/audio/bot/${botLanguage}/${hash}.mp3`
}

// ── Speech Recognition lang helper ───────────────────────────

function getSpeechLang(pair, direction = 'bot-to-user') {
  const [lang1] = (pair || 'es-en').split('-')
  const botLang = lang1

  if (direction === 'bot-to-user') {
    switch (botLang) {
      case 'es': return 'es-ES'
      case 'pt': return 'pt-BR'
      case 'en': return 'en-US'
      default: return 'es-ES'
    }
  } else {
    switch (botLang) {
      case 'es': return 'es-ES'
      case 'pt': return 'pt-BR'
      case 'en': return 'en-US'
      default: return 'es-ES'
    }
  }
}

// ── Bileşen ───────────────────────────────────────────────────

export default function Practice() {
  const navigate    = useNavigate()
  const [params]    = useSearchParams()
  const { t } = useTranslation()
  const word        = params.get('word') || ''
  const difficulty  = params.get('difficulty') || 'easy'

  // Pack + exchange verileri (sadece bir kez hesaplanır)
  const pack      = useMemo(() => getPackForWord(word, difficulty), [word, difficulty])
  const exchanges = useMemo(() => getExchanges(pack), [pack])
  const prevProg  = useMemo(() => getConvProgress(word, difficulty), [word, difficulty])
  const available = useMemo(() => getAvailableDifficulties(word), [word])

  const meta   = DIFF_META[difficulty] ?? DIFF_META.easy
  const nextD  = NEXT_DIFF[difficulty]

  const pairLangId = (pack?.pair || 'es-en').split('-')[0]
  const {
    startListening: sttStart,
    stopListening:  sttStop,
    isListening,
    transcript:     sttTranscript,
    sttSupported:   speechSupported,
  } = useSpeech(pairLangId)

  // ── State ─────────────────────────────────────────────────
  const [phase,       setPhase]       = useState('intro')
  const [exchIdx,     setExchIdx]     = useState(0)
  const [selected,    setSelected]    = useState(null)
  const [answers,     setAnswers]     = useState([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [currentMode, setCurrentMode] = useState(null)
  const [typeInput,   setTypeInput]   = useState('')
  const [typeResult,  setTypeResult]  = useState(null)
  const [speechResult, setSpeechResult] = useState(null)

  const exchange   = exchanges[exchIdx] ?? null
  const isAnswered = selected !== null || typeResult !== null || speechResult !== null

  // Audio referansı
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const prevListeningRef = useRef(false)

  // Bot mesajının ses dosyası yolunu hesapla
  const audioPath = useMemo(() => {
    if (phase !== 'exchange' || !exchange?.bot) return null
    const botLang = pack?.bot_language || 'es'
    return getAudioPath(exchange.bot, botLang)
  }, [phase, exchange, pack])

  // ── Ses çalma fonksiyonu ──────────────────────────────────
  const playAudio = () => {
    if (!audioPath) return

    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.addEventListener('ended', () => setIsPlaying(false))
      audioRef.current.addEventListener('error', () => {
        setIsPlaying(false)
      })
    }

    const audio = audioRef.current

    if (audio.src !== window.location.origin + audioPath) {
      audio.src = audioPath
    }

    audio.play().then(() => {
      setIsPlaying(true)
    }).catch(() => {
      setIsPlaying(false)
    })
  }

  // ── Exchange değiştiğinde otomatik ses çal + mod sıfırla ─
  useEffect(() => {
    if (phase === 'exchange') {
      const resetState = () => {
        setCurrentMode(null)
        setSelected(null)
        setTypeInput('')
        setTypeResult(null)
        setSpeechResult(null)
        sttStop()
      }

      const resetTimer = setTimeout(resetState, 0)

      let audioTimer
      if (exchange?.bot && audioPath) {
        audioTimer = setTimeout(() => {
          playAudio()
        }, 300)
      }

      return () => {
        clearTimeout(resetTimer)
        clearTimeout(audioTimer)
      }
    }
  }, [phase, exchIdx, exchange, audioPath])

  // ── Component unmount olduğunda temizle ──────────────────
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
    }
  }, [])

  // Process speech result when recognition ends (isListening: true → false)
  useEffect(() => {
    const wasListening = prevListeningRef.current
    prevListeningRef.current = isListening
    if (wasListening && !isListening && sttTranscript && exchange && !speechResult) {
      const result = findBestOption(sttTranscript, exchange.options)
      const expectedAnswer = exchange.options[exchange.correct]
      const pronunciationResult = getPronunciationScore(sttTranscript, expectedAnswer)
      if (result.found) {
        const correct = result.index === exchange.correct
        const pts = correct ? MODE_POINTS.speak : 0
        setSpeechResult({
          match: correct,
          score: result.score,
          transcript: sttTranscript,
          suggestion: !correct ? exchange.options[exchange.correct] : null,
          pronunciation: pronunciationResult,
        })
        setAnswers(prev => [...prev, { correct, points: pts, mode: 'speak', pronunciationScore: pronunciationResult?.score ?? null }])
        setTotalPoints(p => p + pts)
      } else {
        setSpeechResult({
          match: false,
          score: 0,
          transcript: sttTranscript,
          suggestion: exchange.options[exchange.correct],
          pronunciation: pronunciationResult,
        })
        setAnswers(prev => [...prev, { correct: false, points: 0, mode: 'speak', pronunciationScore: pronunciationResult?.score ?? null }])
      }
    }
  }, [isListening, sttTranscript, exchange, speechResult])

  // ── Mod seçimi ───────────────────────────────────────────
  const handleModeSelect = (mode) => {
    if (mode === 'speak' && !speechSupported) {
      setCurrentMode('pick')
      return
    }
    setCurrentMode(mode)
  }

  // ── Pick modu: Seçenek seç ──────────────────────────────
  const handleSelect = (idx) => {
    if (selected !== null) return
    const correct = idx === exchange.correct
    const pts     = correct ? MODE_POINTS.pick : 0
    setSelected(idx)
    setAnswers(prev => [...prev, { correct, points: pts, mode: 'pick', pronunciationScore: null }])
    setTotalPoints(p => p + pts)
  }

  // ── Type modu: Cevabı kontrol et ───────────────────────
  const handleTypeSubmit = () => {
    if (!typeInput.trim() || typeResult !== null) return

    const correctAnswer = exchange.options[exchange.correct]
    const result = checkAnswer(typeInput, correctAnswer)
    setTypeResult(result)

    const pts = result.match ? MODE_POINTS.type : 0
    setAnswers(prev => [...prev, { correct: result.match, points: pts, mode: 'type', pronunciationScore: null }])
    setTotalPoints(p => p + pts)
  }

  // ── Speak modu: başlat ──────────────────────────────────
  const startListening = () => {
    if (!speechSupported) { setCurrentMode('pick'); return }
    sttStart()
  }

  // ── Sonraki exchange / özet ────────────────────────────────
  const handleNext = () => {
    if (exchIdx + 1 < exchanges.length) {
      setExchIdx(i => i + 1)
    } else {
      setPhase('summary')
    }
  }

  // ── Summary phase: kaydet ────────────────────────────────
  useEffect(() => {
    if (phase !== 'summary') return

    const _correct = answers.filter(a => a.correct).length
    const _total   = exchanges.length

    saveConvProgress(word, difficulty, totalPoints, _correct, _total)

    const pronScores = answers
      .filter(a => a.pronunciationScore != null)
      .map(a => a.pronunciationScore)
    const avgPron = pronScores.length
      ? Math.round(pronScores.reduce((a, b) => a + b, 0) / pronScores.length)
      : 0

    saveSession({
      word,
      difficulty,
      packId: pack?.id ?? null,
      totalExchanges: _total,
      completedExchanges: answers.length,
      pickScore:  answers.filter(a => a.mode === 'pick').reduce((s, a) => s + a.points, 0),
      typeScore:  answers.filter(a => a.mode === 'type').reduce((s, a) => s + a.points, 0),
      speakScore: answers.filter(a => a.mode === 'speak').reduce((s, a) => s + a.points, 0),
      avgPronunciation: avgPron,
      answers: answers.map(a => ({
        mode: a.mode,
        correct: a.correct,
        score: a.points,
        pronunciationScore: a.pronunciationScore ?? null,
      })),
    })
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── PACK BULUNAMADI ───────────────────────────────────────
  if (!pack) {
    const allWords    = getAllPackWords()
    const suggestions = allWords.slice(0, 12)

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col px-6 pt-12 pb-8"
           style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="w-full max-w-sm mx-auto">

          <div className="text-center mb-6">
            <div className="text-5xl mb-3">😅</div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">No pack found</h2>
            <p className="text-slate-400 text-sm">
              No conversation pack for{' '}
              <span className="font-bold text-slate-700">"{word}"</span>
              {' '}({difficulty})
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Available words ({allWords.length} total)
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map(w => (
                <button
                  key={w}
                  onClick={() => navigate(`/practice?word=${encodeURIComponent(w)}&difficulty=easy`)}
                  className="px-3 py-1.5 bg-cyan-50 border border-cyan-200 text-cyan-700
                             text-sm font-medium rounded-lg hover:bg-cyan-100 transition-colors"
                >
                  {w}
                </button>
              ))}
              {allWords.length > 12 && (
                <span className="text-xs text-slate-400 self-center">
                  +{allWords.length - 12} more
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white
                       font-black rounded-2xl transition-colors"
          >
            ← Go Back
          </button>
        </div>
      </div>
    )
  }

  // ── INTRO ─────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6"
           style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="w-full max-w-sm">

          <div className="text-center mb-7">
            <div className="text-5xl mb-3">💬</div>
            <h1 className="text-2xl font-black text-slate-900"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Practice Time!
            </h1>
          </div>

          {/* Pack kartı */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-5">
            <div className="text-center mb-5">
              <div className="text-4xl font-black text-cyan-600 mb-1"
                   style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {word}
              </div>
              {pack.context && (
                <p className="text-slate-400 text-sm mt-1">📍 {pack.context}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm pt-4 border-t border-slate-100">
              <span className="text-slate-400">{exchanges.length} exchanges</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${meta.bg} ${meta.text}`}>
                {meta.emoji} {meta.label}
              </span>
            </div>

            {/* Önceki skor varsa göster */}
            {prevProg && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Best score</span>
                <span className="font-bold text-slate-600">{prevProg.bestScore} pts
                  · {prevProg.lastCorrect}/{prevProg.lastTotal} correct</span>
              </div>
            )}
          </div>

          {/* Difficulty seçici */}
          {available.length > 1 && (
            <div className="flex gap-2 mb-4">
              {available.map(d => (
                <button
                  key={d}
                  onClick={() => navigate(`/practice?word=${encodeURIComponent(word)}&difficulty=${d}`, { replace: true })}
                  className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold transition-all
                    ${d === difficulty
                      ? `${DIFF_META[d].bg} ${DIFF_META[d].text} ${DIFF_META[d].border}`
                      : 'bg-white border-slate-200 text-slate-400'}`}
                >
                  {DIFF_META[d].emoji} {DIFF_META[d].label}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setPhase('exchange')}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-black
                       text-lg rounded-2xl shadow-lg shadow-cyan-600/25 transition-colors"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Start 🚀
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-full py-2 text-slate-400 hover:text-slate-600 text-sm mt-2 transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    )
  }

  // ── EXCHANGE ──────────────────────────────────────────────
  if (phase === 'exchange') {
    const progressPct = Math.round((exchIdx / exchanges.length) * 100)

    // Mod seçilmemişse, mod seçici göster
    if (!currentMode) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6"
             style={{ fontFamily: 'Inter, sans-serif' }}>
          <div className="w-full max-w-sm">

            {/* Üst bar */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigate(-1)}
                className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
              >
                ✕
              </button>
              <span className="text-sm font-semibold text-slate-500">
                {word} · {exchIdx + 1} / {exchanges.length}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
                {meta.emoji} {meta.label}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-8">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Bot mesajı (küçük) */}
            <div className="flex items-start gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center
                              text-white text-lg shrink-0 shadow-sm">
                🤖
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm
                              px-4 py-3 shadow-sm flex-1">
                <p className="text-slate-800 text-sm leading-relaxed">
                  {exchange?.bot}
                </p>
              </div>
            </div>

            {/* Mod seçici */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4">
              <h3 className="text-center text-sm font-bold text-slate-600 mb-4">
                {t('how do you want to answer') || 'How do you want to answer?'}
              </h3>

              <div className="grid grid-cols-3 gap-3">
                {/* Pick Mode */}
                <button
                  onClick={() => handleModeSelect('pick')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2
                             border-slate-200 hover:border-cyan-300 hover:bg-cyan-50
                             transition-all active:scale-95"
                >
                  <span className="text-3xl">{MODE_ICONS.pick}</span>
                  <span className="text-xs font-bold text-slate-600">Pick</span>
                  <span className="text-xs text-slate-400">{MODE_POINTS.pick} pts</span>
                </button>

                {/* Type Mode */}
                <button
                  onClick={() => handleModeSelect('type')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2
                             border-slate-200 hover:border-cyan-300 hover:bg-cyan-50
                             transition-all active:scale-95"
                >
                  <span className="text-3xl">{MODE_ICONS.type}</span>
                  <span className="text-xs font-bold text-slate-600">Type</span>
                  <span className="text-xs text-slate-400">{MODE_POINTS.type} pts</span>
                </button>

                {/* Speak Mode */}
                <button
                  onClick={() => handleModeSelect('speak')}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2
                             border-slate-200 hover:border-cyan-300 hover:bg-cyan-50
                             transition-all active:scale-95"
                >
                  <span className="text-3xl">{MODE_ICONS.speak}</span>
                  <span className="text-xs font-bold text-slate-600">Speak</span>
                  <span className="text-xs text-slate-400">{MODE_POINTS.speak} pts</span>
                </button>
              </div>

              {!speechSupported && (
                <p className="text-center text-xs text-red-400 mt-3">
                  {t('not available in this browser')}
                </p>
              )}
            </div>
          </div>
        </div>
      )
    }

    // Mod seçilmiş, cevap aşaması
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col px-5 pt-6 pb-8"
           style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="w-full max-w-sm mx-auto flex flex-col flex-1">

          {/* Üst bar */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => { setCurrentMode(null); setSelected(null); setTypeResult(null); setSpeechResult(null); }}
              className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
            >
              ← {t('pick an answer') || 'Change mode'}
            </button>
            <span className="text-sm font-semibold text-slate-500">
              {word} · {exchIdx + 1} / {exchanges.length}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
              {MODE_ICONS[currentMode]} {meta.label}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Bot balonu */}
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center
                            text-white text-lg shrink-0 shadow-sm">
              🤖
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm
                            px-4 py-3 shadow-sm flex-1 relative">
              <p className="text-slate-800 text-sm leading-relaxed">
                {exchange?.bot}
              </p>

              {/* Dinleme butonu */}
              {audioPath && (
                <button
                  onClick={playAudio}
                  disabled={isPlaying}
                  className="absolute -bottom-3 -right-3 w-8 h-8 rounded-full
                             bg-cyan-600 hover:bg-cyan-700 text-white
                             flex items-center justify-center shadow-lg
                             transition-all duration-200 hover:scale-110
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Listen again 🔊"
                >
                  {isPlaying ? (
                    <span className="text-xs">🔊</span>
                  ) : (
                    <span className="text-xs">🔊</span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* PICK MODE */}
          {currentMode === 'pick' && (
            <div className="flex flex-col gap-2 flex-1">
              {exchange?.options?.map((opt, i) => {
                let cls = 'bg-white border-slate-200 text-slate-700 hover:border-cyan-300 hover:bg-cyan-50'
                if (isAnswered) {
                  if (i === exchange.correct) {
                    cls = 'bg-emerald-50 border-emerald-400 text-emerald-800'
                  } else if (i === selected) {
                    cls = 'bg-red-50 border-red-400 text-red-800'
                  } else {
                    cls = 'bg-white border-slate-100 text-slate-300'
                  }
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={isAnswered}
                    className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium
                                 text-left transition-all ${cls}
                                 ${!isAnswered ? 'active:scale-[0.98]' : ''}`}
                  >
                    <span className="text-slate-300 text-xs font-bold mr-2">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>
          )}

          {/* TYPE MODE */}
          {currentMode === 'type' && (
            <div className="flex flex-col gap-3 flex-1">
              <div className="bg-white rounded-xl border-2 border-slate-200 p-4">
                <input
                  type="text"
                  value={typeInput}
                  onChange={(e) => setTypeInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !isAnswered) handleTypeSubmit() }}
                  placeholder={t('type your answer') || 'Type your answer...'}
                  disabled={isAnswered}
                  className="w-full text-sm text-slate-800 outline-none
                             placeholder:text-slate-300"
                />
              </div>

              {!isAnswered && (
                <button
                  onClick={handleTypeSubmit}
                  disabled={!typeInput.trim()}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white
                             font-bold text-sm rounded-xl transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('submit') || 'Submit'}
                </button>
              )}

              {/* Type sonucu */}
              {typeResult && (
                <div className="mt-2">
                  {typeResult.match ? (
                    <div className="rounded-xl px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
                      ✅ <strong>+{MODE_POINTS.type} pts</strong>
                      {exchange.feedback_correct && ` · ${exchange.feedback_correct}`}
                    </div>
                  ) : typeResult.suggestion ? (
                    <div className="rounded-xl px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                      🟡 <strong>{t('well almost') || 'Well almost!'}</strong>
                      <br />
                      <span className="text-xs">{t('did you mean') || 'Did you mean'}: <em>{typeResult.suggestion}</em></span>
                      <br />
                      <span className="text-xs text-slate-500">{t('so close') || 'So close!'}</span>
                    </div>
                  ) : (
                    <div className="rounded-xl px-4 py-3 bg-red-50 border border-red-200 text-red-800 text-sm">
                      ❌ {exchange.feedback_wrong}
                      <br />
                      <span className="text-xs text-slate-500">{t('your answer') || 'Your answer'}: "{typeInput}"</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SPEAK MODE */}
          {currentMode === 'speak' && (
            <div className="flex flex-col gap-3 flex-1 items-center justify-center">
              {!isAnswered && !isListening && (
                <button
                  onClick={startListening}
                  className="w-32 h-32 rounded-full bg-cyan-600 hover:bg-cyan-700
                             text-white text-5xl shadow-lg shadow-cyan-600/25
                             transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  🎤
                </button>
              )}

              {isListening && (
                <button onClick={sttStop} className="text-center">
                  <div className="w-32 h-32 rounded-full bg-red-500 text-white text-5xl
                                  flex items-center justify-center mx-auto mb-4 animate-pulse">
                    🎤
                  </div>
                  <p className="text-sm text-slate-500 animate-pulse">
                    {t('listening') || 'Listening...'} (tap to stop)
                  </p>
                </button>
              )}

              {/* Speak sonucu - Telaffuz Skoru */}
              {speechResult && (
                <div className="w-full mt-4">
                  {/* Telaffuz Skoru Kartı */}
                  {speechResult.pronunciation && (
                    <div className="rounded-2xl p-5 shadow-sm border-2 mb-3"
                         style={{
                           backgroundColor: speechResult.pronunciation.score >= 80 ? '#f0fdf4' :
                                          speechResult.pronunciation.score >= 60 ? '#fefce8' :
                                          speechResult.pronunciation.score >= 40 ? '#fff7ed' :
                                          '#fef2f2',
                           borderColor: speechResult.pronunciation.score >= 80 ? '#86efac' :
                                        speechResult.pronunciation.score >= 60 ? '#fde047' :
                                        speechResult.pronunciation.score >= 40 ? '#fed7aa' :
                                        '#fca5a5',
                         }}>
                      {/* Başlık */}
                      <div className="text-center mb-3">
                        <div className="text-2xl mb-1">🎯</div>
                        <div className="text-sm font-bold" style={{
                          color: speechResult.pronunciation.score >= 80 ? '#166534' :
                                 speechResult.pronunciation.score >= 60 ? '#854d0e' :
                                 speechResult.pronunciation.score >= 40 ? '#9a3412' :
                                 '#991b1b',
                        }}>
                          {t('pronunciation score') || 'Pronunciation Score'}
                        </div>
                      </div>

                      {/* Skor */}
                      <div className="text-center mb-3">
                        <span className="text-5xl font-black" style={{
                          color: speechResult.pronunciation.score >= 80 ? '#16a34a' :
                                 speechResult.pronunciation.score >= 60 ? '#ca8a04' :
                                 speechResult.pronunciation.score >= 40 ? '#ea580c' :
                                 '#dc2626',
                        }}>
                          {speechResult.pronunciation.score}
                        </span>
                        <span className="text-lg text-slate-400 ml-1">
                          {t('out of 100') || '/ 100'}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden mb-3">
                        <div className="h-full rounded-full transition-all duration-500" style={{
                          width: `${speechResult.pronunciation.score}%`,
                          backgroundColor: speechResult.pronunciation.score >= 80 ? '#22c55e' :
                                         speechResult.pronunciation.score >= 60 ? '#eab308' :
                                         speechResult.pronunciation.score >= 40 ? '#f97316' :
                                         '#ef4444',
                        }} />
                      </div>

                      {/* Seviye Mesajı */}
                      <div className="text-center mb-2">
                        <span className="text-sm font-bold" style={{
                          color: speechResult.pronunciation.score >= 80 ? '#15803d' :
                                 speechResult.pronunciation.score >= 60 ? '#a16207' :
                                 speechResult.pronunciation.score >= 40 ? '#c2410c' :
                                 '#b91c1c',
                        }}>
                          {speechResult.pronunciation.level === 'excellent' && '✅ ' + (t('excellent accent') || 'Excellent Accent! Great job!')}
                          {speechResult.pronunciation.level === 'good' && '👍 ' + (t('sounds good') || 'Sounds Good! Keep going!')}
                          {speechResult.pronunciation.level === 'almost' && '💪 ' + (t('almost perfect') || 'Almost Perfect! Try again!')}
                          {speechResult.pronunciation.level === 'tryagain' && '🔄 ' + (t('try again slowly') || 'Try Again Slowly')}
                        </span>
                      </div>

                      {/* Puan Bilgisi */}
                      {speechResult.match && (
                        <div className="text-center text-xs font-bold text-emerald-600 mb-2">
                          +{MODE_POINTS.speak} pts
                        </div>
                      )}

                      {/* Transcript */}
                      <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">
                          {t('your pronunciation') || 'Your pronunciation'}:
                        </div>
                        <div className="text-sm font-medium text-slate-700">
                          "{speechResult.transcript}"
                        </div>
                      </div>

                      {/* Expected Answer */}
                      <div className="text-center mt-2">
                        <div className="text-xs text-slate-400">
                          {t('listen carefully first') || 'Expected'}: "{exchange.options[exchange.correct]}"
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Eşleşme yoksa öneri göster */}
                  {!speechResult.match && speechResult.suggestion && (
                    <div className="rounded-xl px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm text-center">
                      <strong>{t('did you mean') || 'Did you mean'}:</strong> {speechResult.suggestion}
                    </div>
                  )}
                </div>
              )}

              {!isAnswered && !isListening && (
                <p className="text-xs text-slate-400 text-center mt-2">
                  {t('speak now') || 'Click the microphone and speak your answer'}
                </p>
              )}
            </div>
          )}

          {/* Sonraki butonu (cevaplandıysa) */}
          {isAnswered && (
            <div className="mt-4">
              <button
                onClick={handleNext}
                className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white
                           font-black text-base rounded-2xl transition-colors
                           shadow-lg shadow-cyan-600/25"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {exchIdx + 1 < exchanges.length ? 'Next →' : 'See Results 🎯'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── SUMMARY ───────────────────────────────────────────────
  const correct = answers.filter(a => a.correct).length
  const total   = exchanges.length
  const pct     = total > 0 ? Math.round((correct / total) * 100) : 0

  const nextDiffAvailable = nextD && available.includes(nextD)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6"
         style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="w-full max-w-sm">

        {/* Başlık */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{pct >= 67 ? '🎊' : '💪'}</div>
          <h2 className="text-2xl font-black text-slate-900"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {pct >= 67 ? 'Great job!' : 'Keep practicing!'}
          </h2>
          <p className="text-slate-400 text-sm mt-1">"{word}" · {meta.label}</p>
        </div>

        {/* Skor kartı */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4">
          <div className="grid grid-cols-3 gap-4 text-center mb-5">
            <div>
              <div className="text-3xl font-black text-slate-900"
                   style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {total}
              </div>
              <div className="text-xs text-slate-400 mt-1">Total</div>
            </div>
            <div>
              <div className="text-3xl font-black text-emerald-600"
                   style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {correct}
              </div>
              <div className="text-xs text-slate-400 mt-1">Correct ✅</div>
            </div>
            <div>
              <div className="text-3xl font-black text-cyan-600"
                   style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {totalPoints}
              </div>
              <div className="text-xs text-slate-400 mt-1">Points 🏆</div>
            </div>
          </div>

          {/* Mod dağılımı */}
          {answers.length > 0 && (
            <div className="mb-4 text-center">
              <div className="flex justify-center gap-4 text-xs text-slate-400">
                {answers.filter(a => a.mode === 'pick').length > 0 && (
                  <span>👆 {answers.filter(a => a.mode === 'pick').length} pick</span>
                )}
                {answers.filter(a => a.mode === 'type').length > 0 && (
                  <span>⌨️ {answers.filter(a => a.mode === 'type').length} type</span>
                )}
                {answers.filter(a => a.mode === 'speak').length > 0 && (
                  <span>🎤 {answers.filter(a => a.mode === 'speak').length} speak</span>
                )}
              </div>
            </div>
          )}

          {/* Pct bar */}
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-1">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: pct >= 67 ? '#10B981' : '#F59E0B',
              }}
            />
          </div>
          <div className="text-right text-xs text-slate-400">{pct}% correct</div>
        </div>

        {/* Butonlar */}
        <div className="flex flex-col gap-2">
          {/* Sonraki zorluk (pct >= 67 ise öner) */}
          {nextDiffAvailable && pct >= 67 && (
            <button
              onClick={() => navigate(`/practice?word=${encodeURIComponent(word)}&difficulty=${nextD}`)}
              className={`w-full py-4 text-white font-black text-base rounded-2xl
                          transition-colors shadow-lg
                          ${nextD === 'medium'
                            ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'
                            : 'bg-red-500 hover:bg-red-600 shadow-red-500/25'}`}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {DIFF_META[nextD].emoji} Try {DIFF_META[nextD].label} →
            </button>
          )}

          {/* Tekrar dene */}
          <button
            onClick={() => {
              setPhase('intro')
              setExchIdx(0)
              setSelected(null)
              setAnswers([])
              setTotalPoints(0)
              setCurrentMode(null)
              setTypeInput('')
              setTypeResult(null)
              setSpeechResult(null)
            }}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700
                       font-bold text-sm rounded-2xl transition-colors"
          >
            🔄 Try Again
          </button>

          <button
            onClick={() => navigate('/study')}
            className="w-full py-4 bg-slate-900 hover:bg-slate-700 text-white
                       font-black text-base rounded-2xl transition-colors"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Back to Study
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-2 text-slate-400 hover:text-slate-600 text-sm transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}