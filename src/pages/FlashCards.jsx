import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { speak } from '../utils/audioManager'
import { recordDaily } from '../hooks/useDailyStats'
import { CATEGORIES } from '../data/categories'
import { useSpeech } from '../hooks/useSpeech'
import { useWordStore } from '../store/useWordStore'
import { useTranslation } from '../i18n/translations'

const LEVELS = ['A1', 'A2', 'B1', 'B2']
const LEVEL_COLORS = {
  A1: { bg: '#D1FAE5', text: '#065F46', active: '#10B981' },
  A2: { bg: '#DBEAFE', text: '#1E40AF', active: '#3B82F6' },
  B1: { bg: '#FEF3C7', text: '#92400E', active: '#F59E0B' },
  B2: { bg: '#FEE2E2', text: '#991B1B', active: '#EF4444' },
}

function getNativeLangId() {
  try {
    const ui = localStorage.getItem('aguilang_ui_language')
    if (ui) return JSON.parse(ui)
  } catch {}
  const prof = JSON.parse(localStorage.getItem('aguilang_active_profile') || '{}')
  return prof.speak_lang || 'en'
}

// Convert store format (WordEntry) to card format
function normalizeWord(w) {
  return {
    id:   w.id,
    word: w.word,
    tr:   w.translation,
    pron: w.phonetic || '',
    emoji: w.emoji || null,
  }
}

export default function FlashCards() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [words, setWords] = useState([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [showGrammar, setShowGrammar] = useState(false)
  const [showWordList, setShowWordList] = useState(false)
  const [toastType, setToastType] = useState(null)
  const [selectedLevel, setSelectedLevel] = useState('A1')
  const sttTimerRef = useRef(null)

  const [category, setCategory] = useState(() =>
    JSON.parse(localStorage.getItem('aguilang_active_category') || '{}')
  )
  const [lang, setLang] = useState(() =>
    JSON.parse(localStorage.getItem('aguilang_active_lang') || '{ "id": "en" }')
  )

  const { getByLevel, loading: storeLoading } = useWordStore()

  const {
    startListening, stopListening, isListening,
    transcript, sttSupported, checkAnswer,
    sttStop,
  } = useSpeech(lang.id)

  // Check STT result when it arrives
  useEffect(() => {
    if (!transcript) return
    clearTimeout(sttTimerRef.current)
    stopListening()
    if (checkAnswer(current?.word ?? '')) {
      setToastType('correct')
    } else {
      setToastType('wrong')
      speak(current?.id, current?.word, lang.id)
    }
    setTimeout(() => setToastType(null), 2000)
  }, [transcript]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearTimeout(sttTimerRef.current), [])

  useEffect(() => {
    const sync = () => {
      setCategory(JSON.parse(localStorage.getItem('aguilang_active_category') || '{}'))
      setLang(JSON.parse(localStorage.getItem('aguilang_active_lang') || '{ "id": "en" }'))
    }
    window.addEventListener('storage', sync)
    window.addEventListener('aguilang_lang_changed', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('aguilang_lang_changed', sync)
    }
  }, [])

  const handleStt = (e) => {
    e.stopPropagation()
    if (isListening) return
    startListening()
    sttTimerRef.current = setTimeout(() => stopListening(), 3000)
  }

  // ── Reset on level change & load words ──
  useEffect(() => {
    setFlipped(false)
    setIndex(0)
    setShowGrammar(false)

    if (selectedLevel === 'A1') {
      if (!category.id) return

      const saved = localStorage.getItem('aguilang_active_categories')
      if (saved) {
        try {
          const allowed = JSON.parse(saved)
          if (!allowed.includes(category.id)) { navigate('/categories'); return }
        } catch { /* invalid JSON */ }
      }

      let cancelled = false
      ;(async () => {
        try {
          const module = await import(`../data/${category.id}-a1.json`)
          if (cancelled) return
          const data = module.default
          const langData = data.translations?.[lang.id]
          let loadedWords = langData?.words ?? []
          const nativeLangId = getNativeLangId()
          const transLangId = nativeLangId !== lang.id ? nativeLangId
                            : lang.id !== 'en' ? 'en' : 'es'
          const transMap = {}
          ;(data.translations?.[transLangId]?.words ?? []).forEach(w => { if (w.id) transMap[w.id] = w.word })
          loadedWords = loadedWords.map(w => ({ ...w, tr: transMap[w.id] || '' }))
          setWords(loadedWords)
        } catch {
          if (!cancelled) setWords([])
        }
      })()
      return () => { cancelled = true }
    } else {
      if (storeLoading) return
      const nativeLangId = getNativeLangId()
      const raw = getByLevel(selectedLevel, lang.id)
      let result = raw.filter(w => w.language === lang.id).map(normalizeWord)
      if (lang.id === 'en' && nativeLangId !== 'en') {
        // Oxford words have Turkish translations — reverse-map from native-lang store
        const nativeRaw = getByLevel(selectedLevel, nativeLangId)
        const reverseMap = {}
        nativeRaw.forEach(w => {
          const key = (w.translation || '').toLowerCase().trim()
          if (key) reverseMap[key] = w.word
        })
        result = result.map(w => ({
          ...w,
          tr: reverseMap[(w.word || '').toLowerCase().trim()] || '',
        }))
      }
      setWords(result)
    }
  }, [selectedLevel, category.id, lang.id, storeLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  const current = words[index]
  const catMeta   = CATEGORIES.find(c => c.id === category.id)
  const grammarNote = selectedLevel === 'A1' ? catMeta?.grammarNote : null
  const grammarSentences = grammarNote?.sentences?.[lang.id] ?? grammarNote?.sentences?.en ?? []
  const grammarTip = grammarNote?.tip?.[lang.id] ?? grammarNote?.tip?.en ?? grammarNote?.tip ?? null
  const progress  = showGrammar ? 100 : words.length ? Math.round(((index + 1) / words.length) * 100) : 0

  const handlePrev = () => {
    clearTimeout(sttTimerRef.current)
    stopListening()
    setFlipped(false)
    setIndex(i => i - 1)
  }

  const handleNext = () => {
    clearTimeout(sttTimerRef.current)
    stopListening()
    setFlipped(false)
    recordDaily(true)
    setTimeout(() => {
      if (index < words.length - 1) setIndex(index + 1)
      else setShowGrammar(true)
    }, 200)
  }

  // ── Loading (store not ready yet) ──
  if (selectedLevel !== 'A1' && storeLoading) return (
    <div style={{
      minHeight: '100vh', background: '#F8FAFC',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ fontSize: '40px' }}>⏳</div>
      <div style={{ fontSize: '15px', color: '#64748B' }}>Loading words...</div>
    </div>
  )

  // ── No words ──
  if (!words.length) return (
    <div style={{
      minHeight: '100vh', background: '#F8FAFC',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ fontSize: '48px' }}>📭</div>
      <div style={{ fontSize: '16px', color: '#64748B' }}>
        No words found for {selectedLevel}
      </div>
      <button
        onClick={() => navigate('/categories')}
        style={{
          background: '#0891B2', color: 'white', border: 'none',
          borderRadius: '10px', padding: '10px 24px',
          cursor: 'pointer', fontSize: '14px', fontWeight: '600',
        }}
      >
        Go Back
      </button>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', background: '#F8FAFC',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, sans-serif',
    }}>

      {/* Toast */}
      {toastType && (
        <div style={{
          position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
          background: toastType === 'correct' ? '#10B981' : '#F59E0B',
          color: 'white', borderRadius: '24px', padding: '12px 28px',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '15px', fontWeight: '700',
          boxShadow: toastType === 'correct'
            ? '0 4px 16px rgba(16,185,129,0.35)' : '0 4px 16px rgba(245,158,11,0.35)',
          zIndex: 100, whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>
          {toastType === 'correct' ? 'Great! 🌟' : 'Try again! 🎤'}
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 24px' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => showGrammar ? setShowGrammar(false) : navigate('/categories')}
            style={{
              background: '#F1F5F9', border: 'none', borderRadius: '8px',
              width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px',
            }}
          >←</button>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '16px', fontWeight: '700', color: '#0F172A',
            }}>
              {selectedLevel === 'A1'
                ? `${category.emoji || '📚'} ${category.name || 'Flashcard'}`
                : `📚 ${selectedLevel} Words`}
            </div>
          </div>
        </div>

        {/* Level Selector */}
        <div style={{ maxWidth: '520px', margin: '10px auto 0', display: 'flex', gap: '6px' }}>
          {LEVELS.map(lvl => {
            const col = LEVEL_COLORS[lvl]
            const active = selectedLevel === lvl
            return (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                style={{
                  flex: 1, height: '32px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '13px', fontWeight: active ? '700' : '500',
                  background: active ? col.active : col.bg,
                  color: active ? 'white' : col.text,
                  transition: 'all 0.15s',
                  boxShadow: active ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                }}
              >
                {lvl}
              </button>
            )
          })}
        </div>

        {/* Progress */}
        <div style={{ maxWidth: '520px', margin: '10px auto 0' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: '12px', color: '#94A3B8', marginBottom: '6px',
          }}>
            <span>{showGrammar ? 'Done! 🎉' : 'Progress'}</span>
            <span>{showGrammar ? `${words.length} / ${words.length}` : `${index + 1} / ${words.length}`}</span>
          </div>
          <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: LEVEL_COLORS[selectedLevel].active,
              borderRadius: '3px', transition: 'width 0.4s',
            }} />
          </div>
        </div>
      </div>

      {/* Card Area */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}>
        {showGrammar ? (
          grammarNote ? (
            /* ── Grammar Note (only A1) ── */
            <div style={{
              width: '100%', maxWidth: '420px', background: '#FFFBEB',
              borderRadius: '20px', border: '2px solid #FDE68A',
              boxShadow: '0 4px 24px rgba(251,191,36,0.15)',
              padding: '36px 32px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '20px',
            }}>
              <div style={{
                background: '#FEF3C7', border: '1px solid #FDE68A',
                borderRadius: '20px', padding: '6px 16px',
                fontSize: '13px', fontWeight: '700', color: '#92400E', letterSpacing: '0.5px',
              }}>
                📝 Grammar Note
              </div>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {grammarSentences.map((sentence, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'white', borderRadius: '12px',
                    border: '1px solid #FDE68A', padding: '14px 16px', gap: '12px',
                  }}>
                    <div style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '17px', fontWeight: '700', color: '#0F172A', flex: 1,
                    }}>
                      {sentence}
                    </div>
                    <button
                      onClick={() => speak('grammar', sentence, lang.id)}
                      style={{
                        background: '#FEF3C7', border: '1px solid #FDE68A',
                        borderRadius: '8px', width: '34px', height: '34px',
                        cursor: 'pointer', fontSize: '16px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >🔊</button>
                  </div>
                ))}
              </div>
              {grammarTip && (
                <div style={{
                  background: '#FEF9C3', borderRadius: '10px', padding: '12px 16px',
                  fontSize: '13px', color: '#78350F', lineHeight: '1.6', width: '100%', textAlign: 'center',
                }}>
                  💡 {grammarTip}
                </div>
              )}
            </div>
          ) : (
            /* ── Completed (A2/B1/B2) ── */
            <div style={{
              width: '100%', maxWidth: '420px', background: '#F0FDF4',
              borderRadius: '20px', border: '2px solid #BBF7D0',
              boxShadow: '0 4px 24px rgba(16,185,129,0.12)',
              padding: '48px 32px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '16px',
            }}>
              <div style={{ fontSize: '56px' }}>🎉</div>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '24px', fontWeight: '800', color: '#065F46',
              }}>
                Congratulations!
              </div>
              <div style={{ fontSize: '15px', color: '#059669', textAlign: 'center' }}>
                <strong>{words.length}</strong> {selectedLevel} words completed.
              </div>
              <div style={{
                background: 'white', borderRadius: '12px', border: '1px solid #BBF7D0',
                padding: '10px 20px', fontSize: '13px', color: '#64748B',
              }}>
                🔥 Streak continues!
              </div>
            </div>
          )
        ) : (
          /* ── Normal Flash Card ── */
          <div
            onClick={() => setFlipped(!flipped)}
            style={{
              width: '100%', maxWidth: '420px', background: 'white',
              borderRadius: '20px', border: '1px solid #E2E8F0',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              padding: '48px 32px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '16px', cursor: 'pointer',
              transition: 'transform 0.15s', minHeight: '300px', justifyContent: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {current?.emoji && (
              <div style={{
                width: '96px', height: '96px', borderRadius: '50%',
                background: '#EFF8FF', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '52px',
              }}>
                {current.emoji}
              </div>
            )}

            {!flipped ? (
              <>
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '36px', fontWeight: '800', color: '#0F172A',
                  textAlign: 'center',
                }}>
                  {current?.word}
                </div>
                {current?.pron && (
                  <div style={{ fontSize: '16px', color: '#94A3B8' }}>
                    /{current.pron}/
                  </div>
                )}
                <div style={{ fontSize: '13px', color: '#CBD5E1', marginTop: '4px' }}>
                  {t('tap to see meaning')}
                </div>
              </>
            ) : (
              <>
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '36px', fontWeight: '800', color: '#0F172A',
                  textAlign: 'center',
                }}>
                  {current?.word}
                </div>
                <div style={{
                  background: '#F0FDF4', border: '1px solid #BBF7D0',
                  borderRadius: '12px', padding: '12px 28px', textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: '11px', color: '#86EFAC', fontWeight: '700',
                    letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px',
                  }}>
                    Translation
                  </div>
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '28px', fontWeight: '800', color: '#15803D',
                  }}>
                    {current?.tr}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Listen + Say it */}
        {!showGrammar && (
          <div style={{
            display: 'flex', gap: '12px', justifyContent: 'center',
            marginTop: '16px', marginBottom: '4px',
          }}>
            <button
              onClick={() => speak(current?.id, current?.word, lang.id)}
              style={{
                background: 'white', border: '1px solid #CBD5E1',
                borderRadius: '9999px', padding: '0 20px',
                fontSize: '14px', fontWeight: '500', color: '#334155',
                cursor: 'pointer', minHeight: '44px',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              🔊 {t('listen')}
            </button>
            {sttSupported && (
              <button
                onClick={handleStt}
                style={{
                  background: isListening ? '#FEF2F2' : 'white',
                  border: `1px solid ${isListening ? '#FCA5A5' : '#CBD5E1'}`,
                  borderRadius: '9999px', padding: '0 20px',
                  fontSize: '14px', fontWeight: '500',
                  color: isListening ? '#DC2626' : '#334155',
                  cursor: 'pointer', minHeight: '44px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.15s',
                }}
              >
                {isListening ? `🔴 ${t('listening')}...` : `🎤 ${t('say it')}`}
              </button>
            )}
          </div>
        )}

        {/* Visited Words Link */}
        {!showGrammar && (
          <div style={{ textAlign: 'center', marginBottom: '4px' }}>
            <button
              onClick={() => setShowWordList(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '12px', color: '#94A3B8', fontFamily: 'Inter, sans-serif', padding: '4px 8px',
              }}
            >
              📋 {t('view visited words')} ({index + 1}/{words.length})
            </button>
          </div>
        )}

        {/* Visited Words Modal */}
        {showWordList && (
          <div
            onClick={() => setShowWordList(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
              zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: 'white', borderRadius: '20px', width: '100%', maxWidth: '400px',
                maxHeight: '70vh', display: 'flex', flexDirection: 'column',
                boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 20px', borderBottom: '1px solid #E2E8F0', flexShrink: 0,
              }}>
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '15px', fontWeight: '800', color: '#0F172A',
                }}>
                  Words Visited This Session
                </div>
                <button
                  onClick={() => setShowWordList(false)}
                  style={{
                    background: '#F1F5F9', border: 'none', borderRadius: '8px',
                    width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#64748B', fontWeight: '700',
                  }}
                >✕</button>
              </div>
              <div style={{ overflowY: 'auto', padding: '10px 14px', flex: 1 }}>
                {words.slice(0, index + 1).map((w, i) => (
                  <div key={i} style={{
                    padding: '10px 14px', borderRadius: '10px', marginBottom: '3px',
                    borderLeft: `3px solid ${i === index ? '#0891B2' : 'transparent'}`,
                    background: i === index ? '#EFF8FF' : 'transparent',
                    display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px',
                  }}>
                    <span style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: '700', color: '#0F172A',
                    }}>{w[lang.id] || w.word}</span>
                    <span style={{ color: '#CBD5E1' }}>—</span>
                    <span style={{ color: '#64748B' }}>{w.tr}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Buttons */}
        <div style={{
          padding: '16px 24px 32px', display: 'flex', gap: '12px',
          maxWidth: '420px', width: '100%', margin: '0 auto',
        }}>
          {showGrammar ? (
            <button
              onClick={() => navigate('/quiz')}
              style={{
                flex: 1, height: '52px', background: '#0891B2', border: 'none',
                borderRadius: '12px', fontSize: '15px', fontWeight: '700',
                color: 'white', cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Go to Quiz →
            </button>
          ) : (
            <>
              <button
                onClick={handlePrev}
                disabled={index === 0}
                style={{
                  flex: 1, height: '52px', background: 'white',
                  border: '1.5px solid #E2E8F0', borderRadius: '12px',
                  fontSize: '15px', fontWeight: '600',
                  color: index === 0 ? '#CBD5E1' : '#64748B',
                  cursor: index === 0 ? 'default' : 'pointer',
                  fontFamily: 'Inter, sans-serif', opacity: index === 0 ? 0.5 : 1,
                }}
              >
                {t('previous')}
              </button>
              <button
                onClick={handleNext}
                style={{
                  flex: 1, height: '52px',
                  background: LEVEL_COLORS[selectedLevel].active,
                  border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600',
                  color: 'white', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                {t('i got it')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}