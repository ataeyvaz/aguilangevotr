import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { speak } from '../utils/audioManager'
import { loadLesson, saveProgress, getProgress } from '../hooks/useGrammar'
import { useProgress } from '../hooks/useProgress'

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5)

const LANG_LOCALE = { en: 'en-US', de: 'de-DE', es: 'es-ES' }
const STEPS = ['input', 'formula', 'output', 'dialogue']
const STEP_LABELS = ['Examples', 'Formula', 'Exercises', 'Dialogue']

export default function GrammarLessonPage() {
  const navigate        = useNavigate()
  const { lessonId }    = useParams()
  const lang            = JSON.parse(localStorage.getItem('aguilang_active_lang') || '{"id":"en"}')

  const profile   = JSON.parse(localStorage.getItem('aguilang_active_profile') || '{}')
  const { recordGrammar } = useProgress(profile.id || profile.name || 'default')

  const [lesson,    setLesson]    = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [step,      setStep]      = useState(0)   // 0-3

  /* ── Output exercise state ── */
  const [exIndex,   setExIndex]   = useState(0)
  const [fillInput, setFillInput] = useState('')
  const [buildPlaced, setBuildPlaced] = useState([])
  const [buildAvail,  setBuildAvail]  = useState([])
  const [exResult,  setExResult]  = useState(null)  // null | 'correct' | 'wrong'
  const [showHint,  setShowHint]  = useState(false)
  const shakeRef = useRef(null)

  /* ── Input step: translation toggle ── */
  const [shownTr, setShownTr] = useState(new Set())

  /* ── Load lesson ── */
  useEffect(() => {
    const parts = lessonId?.split('-lesson-')
    if (!parts || parts.length < 2) { 
      // Use setTimeout to avoid synchronous state updates
      setTimeout(() => setLoading(false), 0)
      return 
    }
    const [langId, num] = parts
    loadLesson(langId, num)
      .then(data => {
        setLesson(data)
        // Resume from where left off
        const prog = getProgress(lessonId)
        // Use setTimeout to avoid synchronous state updates
        setTimeout(() => setStep(prog.currentStep || 0), 0)
      })
      .catch(() => {})
      .finally(() => setTimeout(() => setLoading(false), 0))
  }, [lessonId])

  /* ── Reset output exercise state ── */
  useEffect(() => {
    if (!lesson) return
    // Use setTimeout to avoid synchronous state updates
    setTimeout(() => {
      setExIndex(0)
      setFillInput('')
      setExResult(null)
      setShowHint(false)
      setBuildPlaced([])
      setBuildAvail([])
    }, 0)
  }, [step, lesson])

  /* ── Prepare build exercise ── */
  useEffect(() => {
    if (!lesson || step !== 2) return
    const ex = lesson.outputExercises[exIndex]
    if (!ex) return
    // Use setTimeout to avoid synchronous state updates
    setTimeout(() => {
      if (ex.type === 'build') {
        const tokens = ex.words.map((w, i) => ({ text: w, idx: i }))
        setBuildAvail(shuffle(tokens))
        setBuildPlaced([])
        setFillInput('')
      } else {
        setFillInput('')
        setBuildPlaced([])
        setBuildAvail([])
      }
      setExResult(null)
      setShowHint(false)
    }, 0)
  }, [exIndex, step, lesson])

  const saveStep = (newStep, completed = false) => {
    saveProgress(lessonId, newStep, completed)
  }

  const goNextStep = () => {
    const next = step + 1
    if (next >= STEPS.length) {
      saveStep(0, true)
      recordGrammar()
      navigate('/grammar')
    } else {
      setStep(next)
      saveStep(next)
    }
  }

  /* ── Output: check fill ── */
  const checkFill = () => {
    if (!lesson) return
    const ex = lesson.outputExercises[exIndex]
    const userAns = fillInput.toLowerCase().trim()
    const correct = ex.answer.toLowerCase().trim()
    const ok = userAns === correct || correct.includes(userAns) || userAns.includes(correct)
    setExResult(ok ? 'correct' : 'wrong')
    if (ok) speak('ex_' + exIndex, ex.answer, lang.id)
    else if (shakeRef.current) {
      shakeRef.current.style.animation = 'none'
      void shakeRef.current.offsetHeight
      shakeRef.current.style.animation = 'glShake 0.4s ease'
    }
  }

  /* ── Output: check build ── */
  const checkBuild = () => {
    if (!lesson) return
    const ex = lesson.outputExercises[exIndex]
    const user = buildPlaced.map(t => t.text).join(' ')
    const correct = ex.answer.join(' ')
    const ok = user === correct
    setExResult(ok ? 'correct' : 'wrong')
    if (ok) speak('ex_' + exIndex, correct, lang.id)
    else if (shakeRef.current) {
      shakeRef.current.style.animation = 'none'
      void shakeRef.current.offsetHeight
      shakeRef.current.style.animation = 'glShake 0.4s ease'
    }
  }

  const goNextEx = () => {
    const next = exIndex + 1
    if (!lesson) return
    if (next >= lesson.outputExercises.length) {
      goNextStep()
    } else {
      setExIndex(next)
    }
  }

  const tapAvail = (token) => {
    if (exResult === 'correct') return
    setBuildAvail(av => av.filter(t => t.idx !== token.idx))
    setBuildPlaced(p => [...p, token])
    setExResult(null)
  }
  const tapPlaced = (token) => {
    if (exResult === 'correct') return
    setBuildPlaced(p => p.filter(t => t.idx !== token.idx))
    setBuildAvail(av => [...av, token])
    setExResult(null)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>
      Loading...
    </div>
  )
  if (!lesson) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#64748B' }}>
      Lesson not found.
    </div>
  )

  const ex = step === 2 ? lesson.outputExercises[exIndex] : null

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes glShake {
          0%,100% { transform: translateX(0) }
          20%      { transform: translateX(-8px) }
          40%      { transform: translateX(8px) }
          60%      { transform: translateX(-6px) }
          80%      { transform: translateX(6px) }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 24px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/grammar')}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
              📐 {lesson.title}
            </div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>{lesson.subtitle}</div>
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ maxWidth: '560px', margin: '12px auto 0', display: 'flex', gap: '6px' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{ height: '4px', borderRadius: '2px', background: i <= step ? '#0891B2' : '#E2E8F0', transition: 'background 0.3s' }} />
              <div style={{ fontSize: '10px', color: i === step ? '#0891B2' : '#CBD5E1', fontWeight: i === step ? '700' : '400', textAlign: 'center', marginTop: '4px' }}>
                {STEP_LABELS[i]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 32px', maxWidth: '560px', width: '100%', margin: '0 auto' }}>

        {/* STEP 1 — INPUT */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#64748B', marginBottom: '4px' }}>
              First, listen to these sentences and examine them:
            </div>
            {lesson.inputSentences.map((s, i) => (
              <div key={i} style={{
                background: 'white', border: '1.5px solid #E2E8F0', borderRadius: '14px',
                padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '16px', fontWeight: '700', color: '#0F172A', flex: 1,
                  }}>{s.text}</div>
                  <button
                    onClick={() => speak('inp_' + i, s.text, lang.id)}
                    style={{ background: '#EFF8FF', border: '1px solid #BAE6FD', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', fontSize: '16px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >🔊</button>
                </div>
                {s.translation && (
                  <div style={{ marginTop: '8px' }}>
                    {shownTr.has(i) ? (
                      <div style={{ fontSize: '13px', color: '#64748B', fontStyle: 'italic' }}>💡 {s.translation}</div>
                    ) : (
                      <button
                        onClick={() => setShownTr(prev => new Set([...prev, i]))}
                        style={{ fontSize: '12px', color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >Show translation →</button>
                    )}
                  </div>
                )}
              </div>
            ))}
            <button
              onClick={goNextStep}
              style={{ marginTop: '8px', width: '100%', padding: '14px', background: '#0891B2', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >Continue →</button>
          </div>
        )}

        {/* STEP 2 — FORMULA */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Formula box */}
            <div style={{ background: '#EFF8FF', border: '2px solid #BAE6FD', borderRadius: '16px', padding: '20px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#0891B2', letterSpacing: '1px', marginBottom: '8px' }}>FORMULA</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '18px', fontWeight: '800', color: '#0F172A', lineHeight: '1.5' }}>
                {lesson.formula}
              </div>
            </div>

            {/* Examples */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {lesson.formulaVisual.map((item, i) => (
                <div key={i} style={{
                  background: item.type === 'correct' ? '#F0FDF4' : '#FEF2F2',
                  border: `1.5px solid ${item.type === 'correct' ? '#86EFAC' : '#FCA5A5'}`,
                  borderRadius: '12px', padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.type === 'correct' ? '✅' : '❌'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>
                      {item.sentence}
                    </div>
                    {item.translation && (
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{item.translation}</div>
                    )}
                    {item.note && (
                      <div style={{ fontSize: '12px', color: '#DC2626', fontWeight: '600', marginTop: '4px' }}>⚠️ {item.note}</div>
                    )}
                  </div>
                  {item.type === 'correct' && (
                    <button
                      onClick={() => speak('fv_' + i, item.sentence, lang.id)}
                      style={{ background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >🔊</button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={goNextStep}
              style={{ marginTop: '8px', width: '100%', padding: '14px', background: '#0891B2', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >I Understand, Let's Practice! →</button>
          </div>
        )}

        {/* STEP 3 — OUTPUT */}
        {step === 2 && ex && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8' }}>
              <span>Exercise {exIndex + 1} / {lesson.outputExercises.length}</span>
              <span style={{ fontWeight: '700', color: '#0891B2' }}>{ex.type === 'fill' ? 'Fill in the Blank' : 'Build Sentence'}</span>
            </div>

            {/* Fill */}
            {ex.type === 'fill' && (
              <>
                <div
                  ref={shakeRef}
                  style={{
                    background: 'white', border: `2px solid ${exResult === 'correct' ? '#86EFAC' : exResult === 'wrong' ? '#FCA5A5' : '#E2E8F0'}`, borderRadius: '14px', padding: '18px 16px',
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '16px', fontWeight: '700', color: '#0F172A', lineHeight: '1.8',
                  }}
                >
                  {ex.sentence.split('___').map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <input
                          type="text"
                          value={fillInput}
                          onChange={e => { setFillInput(e.target.value); setExResult(null) }}
                          onKeyDown={e => e.key === 'Enter' && !exResult && checkFill()}
                          disabled={exResult === 'correct'}
                          placeholder="___"
                          style={{
                            border: `2px solid ${exResult === 'correct' ? '#86EFAC' : exResult === 'wrong' ? '#FCA5A5' : '#BAE6FD'}`,
                            borderRadius: '8px', padding: '4px 10px',
                            fontSize: '15px', fontWeight: '700',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            outline: 'none', width: '120px',
                            background: exResult === 'correct' ? '#F0FDF4' : exResult === 'wrong' ? '#FEF2F2' : 'white',
                            color: '#0F172A',
                          }}
                        />
                      )}
                    </span>
                  ))}
                </div>
                {showHint && (
                  <div style={{ fontSize: '13px', color: '#F59E0B', fontWeight: '600' }}>💡 Hint: {ex.hint}</div>
                )}
                {exResult === 'wrong' && (
                  <div style={{ fontSize: '13px', color: '#DC2626', fontWeight: '600' }}>
                    Try again! Correct answer: <strong>{ex.answer}</strong>
                  </div>
                )}
                {exResult === 'correct' && (
                  <div style={{ fontSize: '13px', color: '#15803D', fontWeight: '700' }}>✅ Great!</div>
                )}
                <div style={{ display: 'flex', gap: '10px' }}>
                  {!exResult && (
                    <button
                      onClick={() => setShowHint(true)}
                      style={{ flex: 1, padding: '12px', background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: '10px', fontSize: '13px', fontWeight: '600', color: '#92400E', cursor: 'pointer' }}
                    >💡 Hint</button>
                  )}
                  <button
                    onClick={exResult === 'correct' ? goNextEx : checkFill}
                    disabled={!fillInput.trim() && !exResult}
                    style={{
                      flex: 2, padding: '12px',
                      background: exResult === 'correct' ? '#10B981' : '#0891B2',
                      color: 'white', border: 'none', borderRadius: '10px',
                      fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >{exResult === 'correct' ? (exIndex + 1 < lesson.outputExercises.length ? 'Next →' : 'Next Step →') : 'Check'}</button>
                </div>
              </>
            )}

            {/* Build */}
            {ex.type === 'build' && (
              <>
                {ex.translation && (
                  <div style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center' }}>💡 {ex.translation}</div>
                )}
                {/* Placement area */}
                <div
                  ref={shakeRef}
                  style={{
                    minHeight: '64px', borderRadius: '14px', padding: '12px 14px',
                    background: exResult === 'correct' ? '#F0FDF4' : exResult === 'wrong' ? '#FEF2F2' : 'white',
                    border: `2px solid ${exResult === 'correct' ? '#86EFAC' : exResult === 'wrong' ? '#FCA5A5' : '#E2E8F0'}`,
                    display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center',
                  }}
                >
                  {buildPlaced.length === 0 && (
                    <span style={{ color: '#CBD5E1', fontSize: '13px', fontStyle: 'italic' }}>Tap words from below to build the sentence...</span>
                  )}
                  {buildPlaced.map(token => (
                    <button key={token.idx} onClick={() => tapPlaced(token)} disabled={exResult === 'correct'}
                      style={{
                        padding: '6px 14px', background: exResult === 'correct' ? '#DCFCE7' : '#EFF8FF',
                        border: `1.5px solid ${exResult === 'correct' ? '#86EFAC' : '#BAE6FD'}`,
                        borderRadius: '20px', fontSize: '14px', fontWeight: '700',
                        color: exResult === 'correct' ? '#15803D' : '#0891B2',
                        cursor: exResult === 'correct' ? 'default' : 'pointer',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >{token.text}</button>
                  ))}
                </div>

                {exResult === 'wrong' && (
                  <div style={{ fontSize: '13px', color: '#DC2626', fontWeight: '600' }}>
                    Try again! Correct order: <strong>{ex.answer.join(' ')}</strong>
                  </div>
                )}
                {exResult === 'correct' && (
                  <div style={{ fontSize: '13px', color: '#15803D', fontWeight: '700' }}>✅ Great!</div>
                )}
                {/* Available words */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', minHeight: '44px' }}>
                  {buildAvail.map(token => (
                    <button key={token.idx} onClick={() => tapAvail(token)}
                      style={{
                        padding: '8px 16px', background: 'white',
                        border: '1.5px solid #E2E8F0', borderRadius: '20px', fontSize: '14px', fontWeight: '600', color: '#0F172A',
                        cursor: exResult === 'correct' ? 'default' : 'pointer',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >{token.text}</button>
                  ))}
                </div>

                <button
                  onClick={exResult === 'correct' ? goNextEx : checkBuild}
                  disabled={!buildPlaced.length && !exResult}
                  style={{
                    width: '100%', padding: '14px',
                    background: exResult === 'correct' ? '#10B981' : buildPlaced.length ? '#0891B2' : '#E2E8F0',
                    color: exResult === 'correct' || buildPlaced.length ? 'white' : '#94A3B8',
                    border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >{exResult === 'correct' ? (exIndex + 1 < lesson.outputExercises.length ? 'Next →' : 'Next Step →') : 'Check'}</button>
              </>
            )}
          </div>
        )}

        {/* STEP 4 — CONTEXT DIALOGUE */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: '14px',
              padding: '12px 16px', fontSize: '13px', color: '#92400E', fontWeight: '600',
            }}>
              🎭 {lesson.contextDialogue.scene}
            </div>
            {lesson.contextDialogue.lines.map((line, i) => {
              const isA = line.role === 'A'
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isA ? 'flex-start' : 'flex-end', gap: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', marginBottom: '2px' }}>
                    {line.role === 'A' ? '👤 A' : '🤖 B'}
                  </div>
                  <div style={{
                    maxWidth: '80%', background: isA ? 'white' : '#EFF8FF',
                    border: `1.5px solid ${isA ? '#E2E8F0' : '#BAE6FD'}`,
                    borderRadius: '14px', padding: '12px 14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>
                          {line.text}
                        </div>
                        {line.translation && (
                          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', fontStyle: 'italic' }}>
                            {line.translation}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => speak('dl_' + i, line.text, lang.id)}
                        style={{ background: '#EFF8FF', border: '1px solid #BAE6FD', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', fontSize: '13px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >🔊</button>
                    </div>
                  </div>
                </div>
              )
            })}
            <button
              onClick={goNextStep}
              style={{ marginTop: '12px', width: '100%', padding: '15px', background: '#10B981', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >🎉 Complete Lesson!</button>
          </div>
        )}
      </div>
    </div>
  )
}