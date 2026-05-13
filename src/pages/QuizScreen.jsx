import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { recordDaily } from '../hooks/useDailyStats'
import { useSpeech } from '../hooks/useSpeech'
import { readSpeechQuiz } from '../hooks/useParentControls'
import { useApp } from '../context/AppContext'

const ALL_CAT_IDS = [
  'animals','colors','numbers','fruits','vegetables','body','family',
  'school','food','greetings','questions','clothing','home','transport',
  'time','jobs','sports','places','adjectives','verbs',
]

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)

export default function QuizScreen() {
  const { recordCard, startSession } = useSession()
  const { uiLanguage } = useApp()
  const navigate = useNavigate()

  const [words, setWords]         = useState([])      // main category words (native lang)
  const [targetWords, setTargetWords] = useState([])  // target language translations
  const [mixedPool, setMixedPool] = useState([])      // phase 1 mixed pool
  const [targetMixedPool, setTargetMixedPool] = useState([]) // phase 1 mixed pool (target lang)
  const [phase, setPhase]         = useState(1)
  const [questions, setQuestions] = useState([])
  const [current, setCurrent]     = useState(0)
  const [selected, setSelected]   = useState(null)
  const [answer, setAnswer]       = useState('')
  const [sentence, setSentence]   = useState([])
  const [bank, setBank]           = useState([])
  const [score, setScore]         = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(null)
  const [speechPhase,  setSpeechPhase]  = useState('idle') // 'idle' | 'listening' | 'done'
  const [passEnabled,  setPassEnabled]  = useState(false)
  const sttTimerRef = useRef(null)

  const [category, setCategory] = useState(() =>
    JSON.parse(localStorage.getItem('aguilang_active_category') || '{}')
  )
  const [lang, setLang] = useState(() =>
    JSON.parse(localStorage.getItem('aguilang_active_lang') || '{"id":"en"}')
  )

  // Ana dil: AppContext'ten (aguilang_ui_language key, her zaman güncel)
  const speakLang = uiLanguage || 'en'

  const speechQuizEnabled = readSpeechQuiz()
  const {
    startListening, stopListening, isListening,
    transcript, sttSupported,
    checkAnswer: sttCheck,
  } = useSpeech(lang.id)

  // ── Phase builder ────────────────────────────────────────
  const buildPhase = useCallback((p, pool, targetPool = []) => {
    const picked = shuffle(pool).slice(0, 5)

    if (p === 1) {
      setQuestions(picked.map(word => {
        // For phase 1: show native language word, give target language options
        const wrong = shuffle(targetPool.filter(x => x.id !== word.id)).slice(0, 3)
        const correct = targetPool.find(x => x.id === word.id)

        const options = shuffle([
          correct || { id: word.id, word: word.word, translation: word.word },
          ...wrong
        ])

        return { word, targetWord: correct, options, type: 'choice' }
      }))
    } else if (p === 2) {
      setQuestions(picked.map(word => {
        const targetWord = targetPool.find(w => w.id === word.id)
        return { word, targetWord, type: 'fill' }
      }))
    } else if (p === 3) {
      const withSentences = targetPool.filter(w => w.sentences && w.sentences.length > 0)
      if (withSentences.length >= 3) {
        const s3 = shuffle(withSentences).slice(0, 3)
        setQuestions(s3.map(word => {
          const s = word.sentences[0]
          return { tr: s.tr, words: s.words, type: 'sentence' }
        }))
      } else {
        setQuestions([
          { tr: 'I have a dog.', words: ['I', 'have', 'a', 'dog'],     type: 'sentence' },
          { tr: 'The cat is small.',      words: ['The', 'cat', 'is', 'small'],  type: 'sentence' },
          { tr: 'The apple is red.',    words: ['The', 'apple', 'is', 'red'],  type: 'sentence' },
        ])
      }
    }

    setCurrent(0)
    setSelected(null)
    setAnswer('')
    setSentence([])
    setBank([])
    setIsCorrect(null)
  }, [])

  // ── STT result evaluation ─────────────────────────────────
  useEffect(() => {
    if (!transcript || !q?.word) return
    clearTimeout(sttTimerRef.current)
    stopListening()
    const ok = sttCheck(q.word[lang.id] ?? q.word.word ?? '')
    
    setSpeechPhase('done')
    setIsCorrect(ok)
    recordCard(q.word.id, ok)
    window.dispatchEvent(new Event('wordStatsUpdated'))
    recordDaily(ok)
    setScore(s => ok ? s + 10 : Math.max(0, s - 5))
  }, [transcript]) // eslint-disable-line react-hooks/exhaustive-deps

  // Unmount cleanup
  useEffect(() => { return () => clearTimeout(sttTimerRef.current) }, [])

  useEffect(() => {
    const sync = () => {
      setCategory(JSON.parse(localStorage.getItem('aguilang_active_category') || '{}'))
      setLang(JSON.parse(localStorage.getItem('aguilang_active_lang') || '{"id":"en"}'))
    }
    window.addEventListener('storage', sync)
    window.addEventListener('aguilang_lang_changed', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('aguilang_lang_changed', sync)
    }
  }, [])

  const handleSpeechStart = () => {
    if (isListening) return
    setSpeechPhase('listening')
    setPassEnabled(false)
    startListening()
    sttTimerRef.current = setTimeout(() => {
      stopListening()
      setPassEnabled(true)
    }, 5000)
  }

  const handlePass = () => {
    clearTimeout(sttTimerRef.current)
    stopListening()
    if (q?.word) {
      recordCard(q.word.id, false)
      window.dispatchEvent(new Event('wordStatsUpdated'))
      recordDaily(false)
    }
    setScore(s => Math.max(0, s - 5))
    
    setSpeechPhase('done')
    setIsCorrect(false)
    setPassEnabled(false)
  }

  // ── Load words + mixed pool ──────────────────────────────────
  useEffect(() => {
    let cancelled = false
    const loadWords = async () => {
      try {
        const module = await import(`../data/${category.id}-a1.json`)
        if (cancelled) return

        // native = user's spoken language (question), target = language being learned (options)
        const translations = module.default.translations ?? {}
        const nativeData = translations[speakLang] || translations['en']
        const targetData = translations[lang.id]   || translations['es']

        if (!nativeData?.words || !targetData?.words) return

        const mainWords = nativeData.words
        const mainTargetWords = targetData.words
        setWords(mainWords)
        setTargetWords(mainTargetWords)
        startSession(category.id, lang.id)

        // Pick 2 random categories, ~30% mix
        const otherIds   = ALL_CAT_IDS.filter(id => id !== category.id)
        const pickedIds  = shuffle(otherIds).slice(0, 2)
        let crossWords   = []
        let crossTargetWords = []

        await Promise.all(pickedIds.map(async catId => {
          try {
            const m  = await import(`../data/${catId}-a1.json`)
            const tr = m.default.translations ?? {}
            const nd = tr[speakLang] || tr['en']
            const td = tr[lang.id]   || tr['es']
            if (nd?.words && td?.words) {
              const tdMap = Object.fromEntries(td.words.map(w => [w.id, w]))
              const picked = shuffle(nd.words).slice(0, 8)
              crossWords = [...crossWords, ...picked]
              crossTargetWords = [...crossTargetWords, ...picked.map(w => tdMap[w.id]).filter(Boolean)]
            }
          } catch { /* skip */ }
        }))

        if (cancelled) return
        const mixed = crossWords.length >= 5 ? [...mainWords, ...crossWords] : mainWords
        const targetMixed = crossTargetWords.length >= 5 ? [...mainTargetWords, ...crossTargetWords] : mainTargetWords
        setMixedPool(mixed)
        setTargetMixedPool(targetMixed)

        // Pass target mixed pool for creating options
        buildPhase(1, mixed, targetMixed)
      } catch {
        if (!cancelled) setWords([])
      }
    }
    if (category.id) loadWords()
    return () => { cancelled = true }
  }, [category.id, lang.id, buildPhase]) // eslint-disable-line react-hooks/exhaustive-deps

  const q = questions[current]

  useEffect(() => {
    if (q?.type === 'sentence' && q?.words) {
      setBank(shuffle(q.words))
      setSentence([])
    }
  }, [current, phase, q?.type, q?.words])

  // ── Answer check ─────────────────────────────────────────
  const checkAnswer = () => {
    if (!q) return
    let correct = false

    if (q.type === 'choice') {
      correct = selected?.id === q.word.id
    } else if (q.type === 'fill') {
      const targetWord = q.targetWord?.word || q.word.word
      correct = answer.trim().toLowerCase() === targetWord.toLowerCase()
    } else if (q.type === 'sentence') {
      correct = q.words.join(' ').toLowerCase() === sentence.join(' ').toLowerCase()
    }

    setIsCorrect(correct)

    if (q.type !== 'sentence') {
      recordCard(q.word?.id, correct)
      window.dispatchEvent(new Event('wordStatsUpdated'))
    }
    recordDaily(correct)

    if (correct) {
      setScore(s => s + 10)
    } else if (!q.wrongRetry) {
      // Wrong answer: add to end of queue (1 retry)
      setQuestions(prev => [...prev, { ...q, wrongRetry: true }])
    }
  }

  // ── Advance to next question (user clicks button) ───────────
  const advanceQuestion = () => {
    clearTimeout(sttTimerRef.current)
    stopListening()
    setSpeechPhase('idle')
    
    setPassEnabled(false)
    setIsCorrect(null)
    if (current < questions.length - 1) {
      setCurrent(c => c + 1)
      setSelected(null)
      setAnswer('')
    } else {
      if (phase < 3) {
        const nextPhase = phase + 1
        setPhase(nextPhase)
        buildPhase(nextPhase, words, targetWords)
      } else {
        setShowResult(true)
      }
    }
  }

  const addToSentence = (word, idx) => {
    setSentence(s => [...s, word])
    setBank(b => b.filter((_, i) => i !== idx))
  }

  const removeFromSentence = (word, idx) => {
    setBank(b => [...b, word])
    setSentence(s => s.filter((_, i) => i !== idx))
  }

  const progress  = questions.length ? Math.round((current / questions.length) * 100) : 0
  const isSpeechQ = speechQuizEnabled && sttSupported && current % 5 === 4 && q?.word != null

  const PHASE_LABELS = { 1: '🎯 Recognition', 2: '✏️ Recall', 3: '🧩 Build Sentence' }

  // ── Result screen ──────────────────────────────────────────
  if (showResult) return (
    <div style={{
      minHeight: '100vh', background: '#F8FAFC',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'Inter, sans-serif', textAlign: 'center',
    }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>
        {score >= 100 ? '🏆' : score >= 70 ? '⭐' : '💪'}
      </div>
      <h2 style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: '28px', fontWeight: '800', color: '#0F172A', marginBottom: '8px',
      }}>
        {score >= 100 ? 'Perfect!' : score >= 70 ? 'Great job!' : 'Keep going!'}
      </h2>
      <p style={{ color: '#64748B', fontSize: '16px', marginBottom: '32px' }}>
        {score} points earned · {category.name} category
      </p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => { setCurrent(0); setPhase(1); setScore(0); setShowResult(false); buildPhase(1, mixedPool.length ? mixedPool : words, targetMixedPool.length ? targetMixedPool : targetWords) }}
          style={{
            padding: '12px 24px', background: 'white',
            border: '1.5px solid #E2E8F0', borderRadius: '12px',
            fontSize: '15px', fontWeight: '600', color: '#64748B', cursor: 'pointer',
          }}
        >🔄 Retry</button>
        <button
          onClick={() => navigate('/categories')}
          style={{
            padding: '12px 24px', background: '#0891B2', border: 'none',
            borderRadius: '12px', fontSize: '15px', fontWeight: '600',
            color: 'white', cursor: 'pointer',
          }}
        >📚 Categories</button>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '12px 24px', background: '#10B981', border: 'none',
            borderRadius: '12px', fontSize: '15px', fontWeight: '600',
            color: 'white', cursor: 'pointer',
          }}
        >🏠 Dashboard</button>
      </div>
    </div>
  )

  if (!q) return null

  // ── Quiz screen ───────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: '#F8FAFC',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 24px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <button
              onClick={() => navigate('/learn')}
              style={{
                background: '#F1F5F9', border: 'none', borderRadius: '8px',
                width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px',
              }}
            >←</button>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '15px', fontWeight: '700', color: '#0F172A',
              }}>
                {PHASE_LABELS[phase]}
                {q.wrongRetry && (
                  <span style={{ fontSize: '11px', color: '#F59E0B', marginLeft: '8px', fontWeight: '600' }}>
                    🔄 Retry
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                {category.emoji} {category.name} · Question {current + 1}/{questions.length}
              </div>
            </div>
            <div style={{
              background: '#F0FDF4', border: '1px solid #BBF7D0',
              borderRadius: '20px', padding: '4px 12px',
              fontSize: '13px', fontWeight: '700', color: '#15803D',
            }}>
              ⭐ {score}
            </div>
          </div>

          <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: '#0891B2', borderRadius: '3px', transition: 'width 0.4s',
            }} />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            {[1, 2, 3].map(p => (
              <div key={p} style={{
                flex: 1, height: '4px', borderRadius: '2px',
                background: p <= phase ? '#0891B2' : '#E2E8F0',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Question */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '32px 24px',
        maxWidth: '560px', width: '100%', margin: '0 auto',
      }}>

        {/* SPEECH QUIZ QUESTION */}
        {isSpeechQ && (
          <>
            <div style={{ fontSize: '72px', marginBottom: '12px' }}>{q.word.emoji}</div>
            <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '8px', textAlign: 'center' }}>
              Say this word:
            </p>
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '32px', fontWeight: '800', color: '#0F172A',
              marginBottom: '6px', textAlign: 'center',
            }}>
              {q.word.word}
            </h2>
            <p style={{ fontSize: '15px', color: '#94A3B8', marginBottom: '32px' }}>
              /{q.word.pron}/
            </p>

            {speechPhase === 'idle' && (
              <button
                onClick={handleSpeechStart}
                style={{
                  padding: '14px 36px', background: '#0891B2', border: 'none',
                  borderRadius: '16px', cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '16px', fontWeight: '700', color: 'white',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}
              >
                🎤 Say it
              </button>
            )}

            {speechPhase === 'listening' && !passEnabled && (
              <div style={{
                padding: '14px 36px', background: '#FEE2E2',
                border: '1.5px solid #FCA5A5', borderRadius: '16px',
                fontSize: '15px', fontWeight: '600', color: '#DC2626',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                🔴 Listening...
              </div>
            )}

            {speechPhase === 'listening' && passEnabled && (
              <button
                onClick={handlePass}
                style={{
                  padding: '14px 36px', background: '#FFF7ED',
                  border: '1.5px solid #FED7AA', borderRadius: '16px', cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '16px', fontWeight: '700', color: '#9C4600',
                }}
              >
                Skip →
              </button>
            )}
          </>
        )}

        {/* PHASE 1 — Multiple choice */}
        {!isSpeechQ && q.type === 'choice' && (
          <>
            <div style={{ fontSize: '72px', marginBottom: '12px' }}>{q.word.emoji}</div>
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '28px', fontWeight: '800', color: '#0F172A',
              marginBottom: '8px', textAlign: 'center',
            }}>{q.word.word}</h2>
            <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '28px' }}>
              What is the translation?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
              {q.options?.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => isCorrect === null && setSelected(opt)}
                  style={{
                    padding: '16px',
                    minHeight: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    background: selected?.id === opt.id
                      ? isCorrect === true  ? '#D1FAE5'
                      : isCorrect === false ? '#FFCCCC' : '#D4ECFF'
                      : '#FFFFFF',
                    border: `2px solid ${selected?.id === opt.id
                      ? isCorrect === true  ? '#10B981'
                      : isCorrect === false ? '#EF4444' : '#0891B2'
                      : '#CBD5E1'}`,
                    borderRadius: '12px',
                    cursor: isCorrect === null ? 'pointer' : 'default',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#1E293B',
                    transition: 'all 0.15s',
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                    lineHeight: '1.4',
                  }}
                >
                  {opt.word || ''}
                </button>
              )) || []}
            </div>
          </>
        )}

        {/* PHASE 2 — Fill in the blank */}
        {q.type === 'fill' && (
          <>
            <div style={{ fontSize: '72px', marginBottom: '12px' }}>{q.word.emoji}</div>
            <p style={{ fontSize: '16px', color: '#64748B', marginBottom: '8px', textAlign: 'center' }}>
              Write in <strong style={{ color: '#0F172A' }}>{lang.name}</strong>:
            </p>
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '28px', fontWeight: '800', color: '#0F172A',
              marginBottom: '6px', textAlign: 'center',
            }}>
              {q.word.word}
            </h2>
            <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '24px' }}>/{q.word.pron}/</p>
            <input
              type="text"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && answer && isCorrect === null && checkAnswer()}
              placeholder="Type your answer..."
              disabled={isCorrect !== null}
              style={{
                width: '100%', padding: '16px', fontSize: '20px', textAlign: 'center',
                border: `2px solid ${isCorrect === true ? '#10B981' : isCorrect === false ? '#EF4444' : '#E2E8F0'}`,
                borderRadius: '12px', outline: 'none',
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: '600',
                background: isCorrect === true ? '#F0FDF4' : isCorrect === false ? '#FEF2F2' : 'white',
                boxSizing: 'border-box',
              }}
            />
          </>
        )}

        {/* PHASE 3 — Build sentence */}
        {q.type === 'sentence' && (
          <>
            <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '8px', textAlign: 'center' }}>
              Build this sentence in {lang.name || 'English'}:
            </p>
            <h3 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '22px', fontWeight: '700', color: '#0F172A',
              marginBottom: '24px', textAlign: 'center',
            }}>
              "{q.tr}"
            </h3>

            <div style={{
              width: '100%', minHeight: '60px', background: 'white',
              border: `2px solid ${isCorrect === true ? '#10B981' : isCorrect === false ? '#EF4444' : '#E2E8F0'}`,
              borderRadius: '12px', padding: '12px',
              display: 'flex', flexWrap: 'wrap', gap: '8px',
              marginBottom: '16px', alignItems: 'center',
            }}>
              {sentence.length === 0 && (
                <span style={{ color: '#CBD5E1', fontSize: '14px' }}>Pick words from below...</span>
              )}
              {sentence.map((w, i) => (
                <button
                  key={i}
                  onClick={() => isCorrect === null && removeFromSentence(w, i)}
                  style={{
                    padding: '6px 14px', background: '#EFF8FF',
                    border: '1.5px solid #0891B2', borderRadius: '8px',
                    fontSize: '15px', fontWeight: '600', color: '#0891B2',
                    cursor: isCorrect === null ? 'pointer' : 'default',
                  }}
                >
                  {w}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '8px' }}>
              {bank.map((w, i) => (
                <button
                  key={i}
                  onClick={() => isCorrect === null && addToSentence(w, i)}
                  style={{
                    padding: '8px 16px', background: 'white',
                    border: '1.5px solid #E2E8F0', borderRadius: '8px',
                    fontSize: '15px', fontWeight: '600', color: '#0F172A',
                    cursor: isCorrect === null ? 'pointer' : 'default',
                  }}
                >
                  {w}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Feedback */}
        {isCorrect !== null && (
          <div style={{
            marginTop: '16px', padding: '12px 20px', borderRadius: '10px',
            background: isCorrect
              ? '#F0FDF4'
              : isSpeechQ ? '#FFF7ED' : '#FEF2F2',
            border: `1px solid ${isCorrect
              ? '#BBF7D0'
              : isSpeechQ ? '#FED7AA' : '#FECACA'}`,
            color: isCorrect
              ? '#15803D'
              : isSpeechQ ? '#9C4600' : '#DC2626',
            fontWeight: '700', fontSize: '15px', textAlign: 'center',
          }}>
            {isSpeechQ
              ? isCorrect
                ? '✅ Great! 🌟'
                : `🔶 Answer: ${q.word[lang.id] ?? q.word.word}`
              : isCorrect
                ? '✅ Correct!'
                : `❌ Correct answer: ${q.targetWord?.word || q.word?.word || q.words?.join(' ')}`
            }
          </div>
        )}
      </div>

      {/* ── Bottom button area ─────────────────────────────── */}
      <div style={{ padding: '16px 24px 32px', maxWidth: '560px', width: '100%', margin: '0 auto' }}>
        {isCorrect === null ? (
          // Check Answer — hidden for speech questions (STT manages its own buttons)
          !isSpeechQ ? (
            <button
              onClick={checkAnswer}
              disabled={
                (q.type === 'choice'   && !selected)          ||
                (q.type === 'fill'     && !answer.trim())      ||
                (q.type === 'sentence' && sentence.length === 0)
              }
              style={{
                width: '100%', height: '52px', background: '#0891B2',
                border: 'none', borderRadius: '12px',
                fontSize: '16px', fontWeight: '700', color: 'white',
                cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                opacity: (
                  (q.type === 'choice'   && !selected)          ||
                  (q.type === 'fill'     && !answer.trim())      ||
                  (q.type === 'sentence' && sentence.length === 0)
                ) ? 0.5 : 1,
              }}
            >
              Check Answer ✓
            </button>
          ) : null
        ) : isCorrect ? (
          // Continue (correct answer)
          <button
            onClick={advanceQuestion}
            style={{
              width: '100%', height: '52px', background: '#10B981',
              border: 'none', borderRadius: '12px',
              fontSize: '16px', fontWeight: '700', color: 'white',
              cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Continue →
          </button>
        ) : (
          // I Understand (wrong answer)
          <button
            onClick={advanceQuestion}
            style={{
              width: '100%', height: '52px', background: '#EF4444',
              border: 'none', borderRadius: '12px',
              fontSize: '16px', fontWeight: '700', color: 'white',
              cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            I Understand ✓
          </button>
        )}
      </div>
    </div>
  )
}