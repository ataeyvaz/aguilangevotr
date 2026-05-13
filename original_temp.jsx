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
import { checkAnswer, findBestOption } from '../utils/fuzzyMatch'
import {
  getPackForWord,
  getExchanges,
  saveConvProgress,
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

  // ── State ─────────────────────────────────────────────────
  const [phase,       setPhase]       = useState('intro')
  const [exchIdx,     setExchIdx]     = useState(0)
  const [selected,    setSelected]    = useState(null)
  const [answers,     setAnswers]     = useState([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [currentMode, setCurrentMode] = useState(null)
  const [typeInput,   setTypeInput]   = useState('')
  const [typeResult,  setTypeResult]  = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [speechResult, setSpeechResult] = useState(null)
  const [speechSupported] = useState(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    return !!SR
  })

  const exchange   = exchanges[exchIdx] ?? null
  const isAnswered = selected !== null || typeResult !== null || speechResult !== null

  // Audio referansı
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // SpeechRecognition referansı
  const recognitionRef = useRef(null)

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
        setIsListening(false)
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
      if (recognitionRef.current) {
        recognitionRef.current.abort()
        recognitionRef.current = null
      }
    }
  }, [])

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
    setAnswers(prev => [...prev, { correct, points: pts, mode: 'pick' }])
    setTotalPoints(p => p + pts)
  }

  // ── Type modu: Cevabı kontrol et ───────────────────────
  const handleTypeSubmit = () => {
    if (!typeInput.trim() || typeResult !== null) return

    const correctAnswer = exchange.options[exchange.correct]
    const result = checkAnswer(typeInput, correctAnswer)
    setTypeResult(result)

    const pts = result.match ? MODE_POINTS.type : 0
    setAnswers(prev => [...prev, { correct: result.match, points: pts, mode: 'type' }])
    setTotalPoints(p => p + pts)
  }

  // ── Speak modu: SpeechRecognition başlat ────────────────
  const startListening = () => {
    if (!speechSupported) {
      setCurrentMode('pick')
      return
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognitionRef.current = recognition

    const pair = pack?.pair || 'es-en'
    recognition.lang = getSpeechLang(pair, 'bot-to-user')

    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setIsListening(false)

      const result = findBestOption(transcript, exchange.options)

      if (result.found) {
        const correct = result.index === exchange.correct
        const pts = correct ? MODE_POINTS.speak : 0
        setSpeechResult({
          match: correct,
          score: result.score,
          transcript,
          suggestion: !correct ? exchange.options[exchange.correct] : null,
        })
        setAnswers(prev => [...prev, { correct, points: pts, mode: 'speak' }])
        setTotalPoints(p => p + pts)
      } else {
        setSpeechResult({
          match: false,
          score: 0,
          transcript,
          suggestion: exchange.options[exchange.correct],
        })
        setAnswers(prev => [...prev, { correct: false, points: 0, mode: 'speak' }])
      }
    }

    recognition.onerror = (event) => {
      setIsListening(false)
      if (event.error === 'not-allowed') {
        alert(t('microphone access required'))
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
    }

    try {
      recognition.start()
    } catch {
      setIsListening(false)
    }
  }

  // ── Sonraki exchange / özet ────────────────────────────────
  const handleNext = () => {
    if (exchIdx + 1 < exchanges.length) {
      setExchIdx(i => i + 1)
    } else {
      setPhase('summary')
    }
  }

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
                <div className="text-center">
                  <div className="w-32 h-32 rounded-full bg-red-500 text-white text-5xl
                                  flex items-center justify-center mx-auto mb-4 animate-pulse">
                    🎤
                  </div>
                  <p className="text-sm text-slate-500 animate-pulse">
                    {t('listening') || 'Listening...'}
                  </p>
                </div>
              )}

              {/* Speak sonucu */}
              {speechResult && (
                <div className="w-full mt-4">
                  {speechResult.match ? (
                    <div className="rounded-xl px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm text-center">
                      ✅ <strong>+{MODE_POINTS.speak} pts</strong>
                      {exchange.feedback_correct && ` · ${exchange.feedback_correct}`}
                      <br />
                      <span className="text-xs text-slate-500">"{speechResult.transcript}"</span>
                    </div>
                  ) : (
                    <div className="rounded-xl px-4 py-3 bg-red-50 border border-red-200 text-red-800 text-sm text-center">
                      ❌ {exchange.feedback_wrong}
                      <br />
                      <span className="text-xs text-slate-500">{t('your answer') || 'Your answer'}: "{speechResult.transcript}"</span>
                      {speechResult.suggestion && (
                        <div className="mt-2 text-xs">
                          <strong>{t('did you mean') || 'Did you mean'}:</strong> {speechResult.suggestion}
                        </div>
                      )}
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

  // Progress kaydı
  saveConvProgress(word, difficulty, totalPoints, correct, total)

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