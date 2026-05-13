import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useTranslation } from '../i18n/translations'
import verbsData from '../data/verbs-a1.json'
import b1Data from '../data/words-b1.json'
import b2Data from '../data/words-b2.json'
import { hasPackForWord } from '../services/conversationService'

// pairId → çeviri dili (her zaman İngilizce dışı taraf)
// Pair 1: en→es | Pair 2: en→pt | Pair 3: es→en | Pair 4: pt→en
const PAIR_LANG = { 1: 'es', 2: 'pt', 3: 'es', 4: 'pt' }

// "ser / estar" → { main: 'ser', alts: ['estar'] }
function splitTranslation(raw) {
  const parts = (raw || '').split('/').map(s => s.trim()).filter(Boolean)
  return { main: parts[0] || '—', alts: parts.slice(1) }
}

// Python safe_filename() ile aynı mantık: boşluk→_ , noktalama kaldır
function safeFilename(text) {
  return (text || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/gu, '')   // noktalama kaldır (Unicode-aware)
    .replace(/\s+/g, '_')
}

// EN ses çal — /audio/en/{wordId}.mp3
function playAudio(wordId) {
  try {
    const a = new Audio(`/audio/en/${wordId}.mp3`)
    a.play().catch(() => {})
    // eslint-disable-next-line no-unused-vars
  } catch (_) { /* ignore */ }
}

// Çeviri sesi çal — /audio/{lang}/{safe(main)}.mp3
function playTranslation(main, lang) {
  if (!main || main === '—') return
  try {
    const a = new Audio(`/audio/${lang}/${safeFilename(main)}.mp3`)
    a.play().catch(() => {})
    // eslint-disable-next-line no-unused-vars
  } catch (_) { /* ignore */ }
}

// Status pill rengi
const STATUS_STYLE = {
  new:      'bg-slate-100 text-slate-500',
  learning: 'bg-amber-100 text-amber-700',
  review:   'bg-cyan-100 text-cyan-700',
  mastered: 'bg-emerald-100 text-emerald-700',
}

// ─────────────────────────────────────────────────────────
export default function Study() {
  const navigate = useNavigate()
  const { currentPair, getStudyWords, recordAnswer, getStats } = useApp()
  const { t } = useTranslation()

  const targetLang = PAIR_LANG[currentPair] ?? 'es'
  const [selectedLevel, setSelectedLevel] = useState('A1')

  // Oturum kelimeleri — sadece bir kez hesaplanır
  const sessionWords = useMemo(
    () => getStudyWords(selectedLevel==='B1' ? b1Data.words : selectedLevel==='B2' ? b2Data.words : verbsData.words, targetLang, 10),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedLevel]
  )
  const TOTAL = sessionWords.length

  const [phase,   setPhase]   = useState(TOTAL === 0 ? 'empty' : 'front')
  const [idx,     setIdx]     = useState(0)
  const [answers, setAnswers] = useState([])   // {word, isCorrect, wasNewMastered}
  const [stats,   setStats]   = useState(null)

  const word = sessionWords[idx] ?? null
  const { main: translation, alts } = word
    ? splitTranslation(word.translation)
    : { main: '—', alts: [] }

  const progressPct = TOTAL > 0 ? Math.round((idx / TOTAL) * 100) : 0

  // ── Auto-play audio on front card ─────────────────────
  useEffect(() => {
    if (phase === 'front' && word) playAudio(word.id)
  }, [phase, idx, word])

  // ── Cevap ver ─────────────────────────────────────────
  const handleAnswer = useCallback((isCorrect, quality) => {
    if (!word) return
    const srs = recordAnswer(word.id, isCorrect, quality)

    const entry = {
      word:          word.word,
      isCorrect,
      wasNewMastered: srs.status === 'mastered',
    }
    const nextAnswers = [...answers, entry]
    setAnswers(nextAnswers)

    if (idx + 1 < TOTAL) {
      setIdx(i => i + 1)
      setPhase('front')
    } else {
      const finalStats = getStats(verbsData.words)
      setStats(finalStats)
      setPhase('summary')
    }
  }, [word, answers, idx, TOTAL, recordAnswer, getStats])

  // ─── EMPTY ────────────────────────────────────────────
  if (phase === 'empty') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Nothing due today!
        </h2>
        <p className="text-slate-500 text-sm mb-8">Come back tomorrow to review.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-8 py-3 bg-cyan-600 text-white font-bold rounded-xl"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  // ─── SUMMARY ──────────────────────────────────────────
  if (phase === 'summary') {
    const correct      = answers.filter(a => a.isCorrect).length
    const wrong        = answers.length - correct
    const newMastered  = answers.filter(a => a.wasNewMastered).length
    const pct          = Math.round((correct / answers.length) * 100)

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6"
           style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="w-full max-w-sm">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-3">{pct >= 70 ? '🎊' : '💪'}</div>
            <h2 className="text-2xl font-black text-slate-900"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Session Complete!
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {pct >= 70 ? t('well done') : t('keep going')}
            </p>
          </div>

          {/* Score card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4">
            <div className="grid grid-cols-3 gap-4 text-center mb-5">
              <div>
                <div className="text-3xl font-black text-slate-900"
                     style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {answers.length}
                </div>
                <div className="text-xs text-slate-400 mt-1">Studied</div>
              </div>
              <div>
                <div className="text-3xl font-black text-emerald-600"
                     style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {correct}
                </div>
                <div className="text-xs text-slate-400 mt-1">Easy ✅</div>
              </div>
              <div>
                <div className="text-3xl font-black text-red-500"
                     style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {wrong}
                </div>
                <div className="text-xs text-slate-400 mt-1">Hard ❌</div>
              </div>
            </div>

        <div style={{display:'flex',gap:'8px',justifyContent:'center',marginBottom:'16px'}}>
          {['A1','B1','B2'].map(l => (
            <button key={l} onClick={() => { setSelectedLevel(l); setIdx(0); setPhase('front'); }}
              style={{padding:'2px 16px',borderRadius:'999px',fontSize:'14px',fontWeight:'bold',border:'1px solid',
                borderColor: selectedLevel===l ? '#0891b2' : '#cbd5e1',
                background: selectedLevel===l ? '#0891b2' : 'white',
                color: selectedLevel===l ? 'white' : '#64748b'}}>{l}</button>
          ))}
        </div>
            {/* Progress bar */}
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-1">
              <div className="h-full bg-cyan-500 rounded-full transition-all"
                   style={{ width: `${pct}%` }} />
            </div>
            <div className="text-right text-xs text-slate-400">{pct}% easy</div>

            {/* New mastered */}
            {newMastered > 0 && (
              <div className="mt-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200
                              rounded-xl p-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <div className="text-sm font-bold text-emerald-800">
                    {newMastered} word{newMastered > 1 ? 's' : ''} mastered!
                  </div>
                  <div className="text-xs text-emerald-600">Added to long-term memory</div>
                </div>
              </div>
            )}
          </div>

          {/* SRS stats */}
          {stats && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                Overall Progress
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: 'New',      val: stats.new,      color: 'text-slate-500' },
                  { label: 'Learning', val: stats.learning,  color: 'text-amber-600' },
                  { label: 'Review',   val: stats.review,    color: 'text-cyan-600'  },
                  { label: 'Mastered', val: stats.mastered,  color: 'text-emerald-600' },
                ].map(({ label, val, color }) => (
                  <div key={label}>
                    <div className={`text-xl font-black ${color}`}
                         style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {val}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Practice butonu — pack mevcut olan en uygun kelimeyi öner */}
          {(() => {
            // Önce yanlış cevaplananları, sonra tüm cevapları dene
            const candidates = [
              ...answers.filter(a => !a.isCorrect),
              ...answers.filter(a =>  a.isCorrect),
            ]
            const practiceW = candidates.find(a => hasPackForWord(a.word))?.word
            if (!practiceW) return null
            return (
              <button
                onClick={() => navigate(`/chatbot?word=${encodeURIComponent(practiceW)}&difficulty=easy`)}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700
                           text-white font-black text-base rounded-2xl transition-colors
                           shadow-lg shadow-amber-500/25 mb-3"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                💬 Practice "{practiceW}"
              </button>
            )
          })()}

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800
                       text-white font-black text-base rounded-2xl transition-colors
                       shadow-lg shadow-cyan-600/25"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ─── FLASHCARD ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col px-5 pt-6 pb-8"
         style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="w-full max-w-sm mx-auto flex flex-col flex-1">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-slate-600 text-sm font-medium"
          >
            ✕
          </button>
          <span className="text-sm font-semibold text-slate-500">
            {idx + 1} / {TOTAL}
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full
            ${STATUS_STYLE[word?.status] ?? STATUS_STYLE.new}`}>
            {word?.status ?? 'new'}
          </span>
        </div>

        <div style={{display:'flex',gap:'8px',justifyContent:'center',marginBottom:'16px'}}>
          {['A1','B1','B2'].map(l => (
            <button key={l} onClick={() => { setSelectedLevel(l); setIdx(0); setPhase('front'); }}
              style={{padding:'2px 16px',borderRadius:'999px',fontSize:'14px',fontWeight:'bold',border:'1px solid',
                borderColor: selectedLevel===l ? '#0891b2' : '#cbd5e1',
                background: selectedLevel===l ? '#0891b2' : 'white',
                color: selectedLevel===l ? 'white' : '#64748b'}}>{l}</button>
          ))}
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-6">
          <div className="h-full bg-cyan-500 rounded-full transition-all duration-500"
               style={{ width: `${progressPct}%` }} />
        </div>

        {/* ── FRONT card ──────────────────────────────── */}
        {phase === 'front' && (
          <div className="flex flex-col flex-1">
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm
                            flex flex-col items-center justify-center p-8 mb-5">

              {/* EN word */}
              <div className="text-5xl font-black text-slate-900 mb-3 text-center"
                   style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {word?.word}
              </div>

              {/* IPA */}
              {word?.ipa && (
                <div className="text-lg text-slate-400 mb-4">/{word.ipa}/</div>
              )}

              {/* Audio button */}
              <button
                onClick={() => playAudio(word?.id)}
                className="w-12 h-12 rounded-full bg-teal-500 hover:bg-teal-600
                           flex items-center justify-center text-xl text-white
                           shadow-sm transition-colors"
                title="Play audio"
              >
                🔊
              </button>
            </div>

            <button
              onClick={() => setPhase('back')}
              className="w-full py-4 bg-slate-900 hover:bg-slate-700 text-white
                         font-bold text-base rounded-2xl transition-colors"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {t('show answer')}
            </button>
          </div>
        )}

        {/* ── BACK card ───────────────────────────────── */}
        {phase === 'back' && (
          <div className="flex flex-col flex-1">
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm
                            flex flex-col items-center justify-center p-8 mb-5">

              {/* EN word small */}
              <div className="text-base text-slate-400 mb-1">{word?.word}</div>
              {word?.ipa && (
                <div className="text-sm text-slate-300 mb-5">/{word.ipa}/</div>
              )}

              {/* Translation big + audio */}
              <div className="flex items-center gap-3 mb-2">
                <div className="text-4xl font-black text-slate-900 text-center"
                     style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {translation}
                </div>
                <button
                  onClick={() => playTranslation(translation, targetLang)}
                  className="w-12 h-12 rounded-full bg-teal-500 hover:bg-teal-600
                             flex items-center justify-center text-xl text-white
                             shadow-sm transition-colors shrink-0"
                  title="Play translation"
                >
                  🔊
                </button>
              </div>

              {/* Alt translations */}
              {alts.length > 0 && (
                <div className="text-sm text-slate-400 mb-3">
                  ({alts.join(', ')})
                </div>
              )}

              {/* Example sentence */}
              {word?.example_source && (
                <div className="mt-3 px-4 py-2 bg-slate-50 rounded-xl
                                text-sm text-slate-500 italic text-center">
                  "{word.example_source}"
                </div>
              )}
            </div>

            {/* Hard / Easy buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleAnswer(false, 2)}
                className="py-4 bg-red-50 border-2 border-red-200 hover:bg-red-100
                           text-red-700 font-bold rounded-2xl transition-all
                           active:scale-95"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                ❌ {t('hard')}
              </button>
              <button
                onClick={() => handleAnswer(true, 4)}
                className="py-4 bg-emerald-50 border-2 border-emerald-300
                           hover:bg-emerald-100 text-emerald-700 font-bold
                           rounded-2xl transition-all active:scale-95"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                ✅ {t('easy')}
              </button>
            </div>

            {/* ChatBot CTA */}
            <button
              onClick={() => navigate('/scenarios')}
              className="mt-4 w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500
                         hover:from-cyan-600 hover:to-blue-600 text-white font-bold
                         text-sm rounded-2xl transition-all active:scale-95
                         flex items-center justify-center gap-2 shadow-md"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              🤖 {t('practice with chatbot')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
