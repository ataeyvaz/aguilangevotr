import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSpeech } from '../hooks/useSpeech'

const DIALOGUES_META = [
  { id: 'home',       title: 'Home Conversation',    emoji: '🏠', lines: 10 },
  { id: 'market',     title: 'Market Shopping',      emoji: '🛒', lines: 10 },
  { id: 'park',       title: 'Park Games',          emoji: '🌳', lines: 10 },
  { id: 'restaurant', title: 'Restaurant Order',    emoji: '🍽️', lines: 10 },
  { id: 'school',     title: 'School Introduction',  emoji: '🏫', lines: 10 },
  { id: 'travel',     title: 'Travel Questions',   emoji: '🗺️', lines: 10 },
]

export default function DialogueScreen() {
  const navigate  = useNavigate()
  const [selected,  setSelected]  = useState(null)
  const [dialogue,  setDialogue]  = useState(null)
  const [lineIndex, setLineIndex] = useState(0)
  const scrollRef    = useRef(null)
  const didSpeakRef  = useRef(false)

  const lang = (() => {
    try { return JSON.parse(localStorage.getItem('aguilang_active_lang') || '{"id":"en"}') }
    catch { return { id: 'en' } }
  })()

  const { speak, stopSpeaking, isSpeaking } = useSpeech(lang.id)

  // ── Load dialogue ────────────────────────────────
  useEffect(() => {
    if (!selected) return
    setDialogue(null)
    setLineIndex(0)
    didSpeakRef.current = false
    import(`../data/dialogues/${selected}-a1.json`)
      .then(m => setDialogue(m.default))
      .catch(() => setDialogue(null))
  }, [selected])

  const childRole    = dialogue?.roles[0]
  const currentLine  = dialogue?.lines[lineIndex]
  const isChildTurn  = currentLine?.speaker === childRole
  const isDone       = !!dialogue && lineIndex >= dialogue.lines.length

  // ── Auto-start TTS on parent lines ─────────────────
  useEffect(() => {
    if (!dialogue || !currentLine || isChildTurn || isDone) return
    didSpeakRef.current = false
    const text = currentLine[lang.id] || currentLine.en
    const t = setTimeout(() => speak(text), 350)
    return () => clearTimeout(t)
  }, [lineIndex, dialogue]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-advance when TTS ends ─────────────────
  useEffect(() => {
    if (isSpeaking) {
      didSpeakRef.current = true
    } else if (didSpeakRef.current) {
      didSpeakRef.current = false
      const t = setTimeout(() => setLineIndex(i => i + 1), 450)
      return () => clearTimeout(t)
    }
  }, [isSpeaking])

  // ── Scroll to bottom line ─────────────────
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lineIndex])

  const handleBack = () => {
    stopSpeaking()
    setSelected(null)
    setDialogue(null)
    setLineIndex(0)
  }

  const advanceLine = () => setLineIndex(i => i + 1)

  const handleSpeak = () => {
    if (!currentLine) return
    speak(currentLine[lang.id] || currentLine.en)
  }

  // ════════════════════════════════════════
  // LİSTELE
  // ════════════════════════════════════════
  if (!selected) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>
        <div style={{
          background: 'white', borderBottom: '1px solid #E2E8F0',
          padding: '14px 24px', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: '#F1F5F9', border: 'none', borderRadius: '8px',
                width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >←</button>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '20px', fontWeight: '800', color: '#0F172A',
            }}>
              🎮 Dialogues
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 24px 40px' }}>
          <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px' }}>
            Select a dialogue and practice speaking!
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {DIALOGUES_META.map(d => (
              <button
                key={d.id}
                onClick={() => setSelected(d.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  background: 'white', border: '1px solid #E2E8F0',
                  borderRadius: '16px', padding: '18px 20px',
                  cursor: 'pointer', textAlign: 'left',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'box-shadow 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'}
              >
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px',
                  background: '#EFF8FF', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '26px', flexShrink: 0,
                }}>
                  {d.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '16px', fontWeight: '700', color: '#0F172A',
                  }}>{d.title}</div>
                  <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '3px' }}>
                    {d.lines} lines
                  </div>
                </div>
                <div style={{
                  background: '#F0FDF4', border: '1px solid #BBF7D0',
                  borderRadius: '8px', padding: '3px 10px',
                  fontSize: '12px', fontWeight: '700', color: '#15803D',
                  flexShrink: 0,
                }}>A1</div>
                <div style={{ fontSize: '20px', color: '#CBD5E1' }}>›</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════
  // YÜKLEME
  // ════════════════════════════════════════
  if (!dialogue) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F8FAFC',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '12px', fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ fontSize: '32px' }}>⏳</div>
        <div style={{ fontSize: '14px', color: '#94A3B8' }}>Loading...</div>
      </div>
    )
  }

  const meta = DIALOGUES_META.find(d => d.id === selected)

  // ════════════════════════════════════════
  // BİTİŞ EKRANI
  // ════════════════════════════════════════
  if (isDone) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px', gap: '20px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '72px' }}>🎉</div>
        <div style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '26px', fontWeight: '800', color: '#0F172A',
        }}>
          Great job!
        </div>
        <div style={{ fontSize: '15px', color: '#64748B', maxWidth: '320px', lineHeight: '1.7' }}>
          <strong>{meta?.emoji} {meta?.title}</strong> dialogue completed.
          <br />{dialogue.lines.length} lines spoken! 💬
        </div>
        <div style={{
          background: '#FEF3C7', border: '1px solid #FDE68A',
          borderRadius: '16px', padding: '16px 28px',
          fontSize: '14px', color: '#92400E', fontWeight: '600',
        }}>
          ⭐ Congratulations, {childRole}! Your language practice is improving.
        </div>
        <button
          onClick={handleBack}
          style={{
            background: '#0891B2', color: 'white', border: 'none',
            borderRadius: '14px', padding: '14px 36px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '16px', fontWeight: '700', cursor: 'pointer',
            marginTop: '8px',
          }}
        >
          🔙 Back to List
        </button>
      </div>
    )
  }

  // ════════════════════════════════════════
  // KONUŞMA GÖRÜNÜMÜ
  // ════════════════════════════════════════
  const visibleLines = dialogue.lines.slice(0, lineIndex + 1)
  const progressPct  = Math.round((lineIndex / dialogue.lines.length) * 100)

  return (
    <div style={{
      minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        background: 'white', borderBottom: '1px solid #E2E8F0',
        padding: '12px 20px', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleBack}
            style={{
              background: '#F1F5F9', border: 'none', borderRadius: '8px',
              width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >←</button>
          <div style={{
            flex: 1,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '15px', fontWeight: '700', color: '#0F172A',
          }}>
            {meta?.emoji} {meta?.title}
          </div>
          <div style={{
            background: '#EFF8FF', borderRadius: '8px', padding: '4px 12px',
            fontSize: '13px', fontWeight: '700', color: '#0891B2', flexShrink: 0,
          }}>
            {lineIndex + 1} / {dialogue.lines.length}
          </div>
        </div>
        <div style={{ maxWidth: '600px', margin: '8px auto 0' }}>
          <div style={{ height: '4px', background: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progressPct}%`,
              background: '#0891B2', borderRadius: '2px', transition: 'width 0.4s',
            }} />
          </div>
        </div>
      </div>

      {/* Lines */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 20px',
        maxWidth: '600px', width: '100%', margin: '0 auto',
        display: 'flex', flexDirection: 'column', gap: '14px',
        boxSizing: 'border-box',
      }}>
        {visibleLines.map((line, i) => {
          const isChild  = line.speaker === childRole
          const isActive = i === lineIndex
          const text     = line[lang.id] || line.en
          const showDots = isActive && !isChild && isSpeaking

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: isChild ? 'row-reverse' : 'row',
                alignItems: 'flex-end', gap: '8px',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: isChild ? '#FEF3C7' : '#F1F5F9',
                border: `1px solid ${isChild ? '#FDE68A' : '#E2E8F0'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '17px', flexShrink: 0,
              }}>
                {isChild ? '🦅' : '🧑'}
              </div>

              {/* Balloon + meta */}
              <div style={{ maxWidth: '78%' }}>
                {/* Speaker name */}
                <div style={{
                  fontSize: '11px', color: '#CBD5E1', fontWeight: '600',
                  marginBottom: '4px',
                  textAlign: isChild ? 'right' : 'left',
                }}>
                  {line.speaker}
                </div>

                {/* Balloon */}
                <div style={{
                  background: isChild ? '#FEF3C7' : '#F1F5F9',
                  border: `1px solid ${isChild ? '#FDE68A' : '#E2E8F0'}`,
                  borderRadius: isChild
                    ? '16px 4px 16px 16px'
                    : '4px 16px 16px 16px',
                  padding: '12px 16px',
                }}>
                  {showDots ? (
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center', padding: '4px 2px' }}>
                      {[0, 1, 2].map(j => (
                            <div
                              key={j}
                              style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: '#94A3B8',
                                animation: `dlg-bounce 1.1s ease-in-out ${j * 0.18}s infinite`,
                              }}
                            />
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '15px', fontWeight: '600', color: '#0F172A',
                      lineHeight: '1.55',
                    }}>
                      {text}
                    </div>
                  )}
                </div>

                {/* Active child line: translation + hint */}
                {isActive && isChild && (
                  <div style={{ marginTop: '6px', textAlign: 'right' }}>
                    <div style={{
                      fontSize: '13px', color: '#94A3B8',
                      fontStyle: 'italic', lineHeight: '1.5',
                    }}>
                      {line.translation}
                    </div>
                    {line.hint && (
                      <div style={{ fontSize: '11px', color: '#CBD5E1', marginTop: '2px' }}>
                        💡 {line.hint}
                      </div>
                    )}
                  </div>
                )}

                {/* Active opponent line: translation */}
                {isActive && !isChild && !showDots && (
                  <div style={{ marginTop: '6px', textAlign: 'left' }}>
                    <div style={{
                      fontSize: '13px', color: '#94A3B8',
                      fontStyle: 'italic', lineHeight: '1.5',
                    }}>
                      {line.translation}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Scroll anchor */}
        <div ref={scrollRef} style={{ height: '1px' }} />
      </div>

      {/* Footer */}
      <div style={{
        background: 'white', borderTop: '1px solid #E2E8F0',
        padding: '16px 20px 28px',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {isChildTurn ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleSpeak}
                style={{
                  marginTop: '8px', padding: '8px 20px',
                  background: isSpeaking ? '#FEE2E2' : '#EFF8FF',
                  border: `1.5px solid ${isSpeaking ? '#FCA5A5' : '#BAE6FD'}`,
                  borderRadius: '20px', fontSize: '13px', fontWeight: '600',
                  color: isSpeaking ? '#DC2626' : '#0891B2',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.15s',
                }}
              >
                {isSpeaking ? '🔴 Listening...' : '🎤 Say it'}
              </button>
              <button
                onClick={advanceLine}
                style={{
                  flex: 1, height: '52px',
                  background: '#0891B2', border: 'none',
                  borderRadius: '12px', fontSize: '15px', fontWeight: '700',
                  color: 'white', cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                I Said It ✓
              </button>
            </div>
          ) : (
            <div style={{
              height: '52px', background: '#F8FAFC', border: '1px solid #E2E8F0',
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              fontSize: '14px', color: '#94A3B8', fontWeight: '600',
            }}>
              <span style={{ fontSize: '18px' }}>🔊</span>
              {currentLine?.speaker} is speaking...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}