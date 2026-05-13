import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useTranslation } from '../i18n/translations'
import trA1Data from '../data/words-tr-a1.json'

const PAIR_LANG = { 1: 'es', 2: 'pt', 3: 'en', 4: 'en', 5: 'en', 6: 'es', 7: 'pt' }

const CATEGORIES = [
  'all', 'food', 'animals', 'colors', 'numbers',
  'family', 'body', 'home', 'transport', 'fruits', 'school',
]

const CAT_LABELS = {
  all: 'Tümü', food: 'Yiyecek', animals: 'Hayvanlar', colors: 'Renkler',
  numbers: 'Sayılar', family: 'Aile', body: 'Vücut', home: 'Ev',
  transport: 'Ulaşım', fruits: 'Meyveler', school: 'Okul',
}

const LANG_FLAGS = { en: '🇺🇸', es: '🇪🇸', pt: '🇧🇷' }
const LANG_NAMES = { en: 'English', es: 'Español', pt: 'Português' }

const STATUS_STYLE = {
  new:      'bg-slate-100 text-slate-500',
  learning: 'bg-amber-100 text-amber-700',
  review:   'bg-cyan-100 text-cyan-700',
  mastered: 'bg-emerald-100 text-emerald-700',
}

// Her iki taraf için ortak backface stilleri
const FACE_BASE = {
  position: 'absolute', inset: 0,
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
}

// Türkçe ve Unicode karakterleri korur — sadece boşlukları _ yapar
function audioFilename(text) {
  return (text || '').trim().toLowerCase().replace(/\s+/g, '_')
}

function playAudio(path) {
  if (import.meta.env.DEV) console.log('[Audio] oynatılıyor:', path)
  try {
    const a = new Audio(path)
    a.onerror = () => {
      if (import.meta.env.DEV) console.warn('[Audio] dosya bulunamadı:', path)
    }
    a.play().catch(() => {})
  } catch (_) {}
}

// ─────────────────────────────────────────────────────────
export default function Study() {
  const navigate = useNavigate()
  const { currentPair, getStudyWords, recordAnswer, getStats } = useApp()
  const { t } = useTranslation()

  const targetLang = PAIR_LANG[currentPair] ?? 'en'

  const [selectedCategory, setSelectedCategory] = useState('all')
  const [phase,   setPhase]   = useState('front')
  const [idx,     setIdx]     = useState(0)
  const [answers, setAnswers] = useState([])
  const [stats,   setStats]   = useState(null)

  const filteredWords = useMemo(() => {
    const base = selectedCategory === 'all'
      ? trA1Data
      : trA1Data.filter(w => w.category === selectedCategory)
    return base.map(w => ({ ...w, word: w.tr, translation: w[targetLang] ?? '—' }))
  }, [selectedCategory, targetLang])

  const sessionWords = useMemo(
    () => getStudyWords(filteredWords, targetLang, 10),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedCategory, targetLang]
  )
  const TOTAL = sessionWords.length

  // Kategori veya dil değişince oturumu sıfırla
  useEffect(() => {
    setIdx(0)
    setAnswers([])
    setStats(null)
    setPhase(sessionWords.length === 0 ? 'empty' : 'front')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, targetLang])

  const word        = sessionWords[idx] ?? null
  const progressPct = TOTAL > 0 ? Math.round((idx / TOTAL) * 100) : 0

  // Ön yüze geçince TR sesini otomatik çal
  useEffect(() => {
    if (phase === 'front' && word) {
      if (import.meta.env.DEV) {
        console.log('[Study] word:', {
          tr: word.tr, emoji: word.emoji,
          category: word.category, targetLang,
          translation: word[targetLang],
        })
      }
      playAudio(`/audio/tr/${audioFilename(word.tr)}.mp3`)
    }
  }, [phase, idx, word, targetLang])

  const handleAnswer = useCallback((isCorrect, quality) => {
    if (!word) return
    const srs = recordAnswer(word.id, isCorrect, quality)
    const next = [...answers, { word: word.tr, isCorrect, wasNewMastered: srs.status === 'mastered' }]
    setAnswers(next)
    if (idx + 1 < TOTAL) {
      setIdx(i => i + 1)
      setPhase('front')
    } else {
      setStats(getStats(filteredWords))
      setPhase('summary')
    }
  }, [word, answers, idx, TOTAL, recordAnswer, getStats, filteredWords])

  // ── Kategori filtresi ──────────────────────────────────
  const CategoryBar = () => (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-4" style={{ scrollbarWidth: 'none' }}>
      {CATEGORIES.map(cat => (
        <button key={cat} onClick={() => setSelectedCategory(cat)}
          className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold border transition-all
            ${selectedCategory === cat
              ? 'bg-cyan-600 border-cyan-600 text-white'
              : 'bg-white border-slate-200 text-slate-500 hover:border-cyan-300'}`}>
          {CAT_LABELS[cat]}
        </button>
      ))}
    </div>
  )

  // ─── EMPTY ────────────────────────────────────────────
  if (phase === 'empty') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6"
           style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="w-full max-w-sm">
          <CategoryBar />
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Bugün tekrar edecek kelime yok!
            </h2>
            <p className="text-slate-500 text-sm mb-8">Yarın tekrar gelin.</p>
            <button onClick={() => navigate('/dashboard')}
              className="px-8 py-3 bg-cyan-600 text-white font-bold rounded-xl">
              Panele Dön
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── SUMMARY ──────────────────────────────────────────
  if (phase === 'summary') {
    const correct     = answers.filter(a => a.isCorrect).length
    const wrong       = answers.length - correct
    const newMastered = answers.filter(a => a.wasNewMastered).length
    const pct         = Math.round((correct / answers.length) * 100)

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6"
           style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="w-full max-w-sm">

          <div className="text-center mb-8">
            <div className="text-6xl mb-3">{pct >= 70 ? '🎊' : '💪'}</div>
            <h2 className="text-2xl font-black text-slate-900"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Oturum Tamamlandı!
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {pct >= 70 ? t('well done') : t('keep going')}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4">
            <div className="grid grid-cols-3 gap-4 text-center mb-5">
              {[
                { val: answers.length, label: 'Çalışılan',  color: 'text-slate-900'   },
                { val: correct,        label: 'Kolay ✅',   color: 'text-emerald-600' },
                { val: wrong,          label: 'Zor ❌',     color: 'text-red-500'     },
              ].map(({ val, label, color }) => (
                <div key={label}>
                  <div className={`text-3xl font-black ${color}`}
                       style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {val}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{label}</div>
                </div>
              ))}
            </div>

            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-1">
              <div className="h-full bg-cyan-500 rounded-full transition-all"
                   style={{ width: `${pct}%` }} />
            </div>
            <div className="text-right text-xs text-slate-400">{pct}% kolay</div>

            {newMastered > 0 && (
              <div className="mt-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <div className="text-sm font-bold text-emerald-800">
                    {newMastered} kelime öğrenildi!
                  </div>
                  <div className="text-xs text-emerald-600">Uzun süreli belleğe eklendi</div>
                </div>
              </div>
            )}
          </div>

          {stats && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                Genel İlerleme
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: 'Yeni',        val: stats.new,      color: 'text-slate-500'   },
                  { label: 'Öğrenilen',   val: stats.learning, color: 'text-amber-600'   },
                  { label: 'Tekrar',      val: stats.review,   color: 'text-cyan-600'    },
                  { label: 'Ustalaşıldı', val: stats.mastered, color: 'text-emerald-600' },
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

          <button onClick={() => navigate('/dashboard')}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800
                       text-white font-black text-base rounded-2xl transition-colors
                       shadow-lg shadow-cyan-600/25"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Panele Dön
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
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-slate-600 text-sm font-medium">
            ✕
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700">
              A1
            </span>
            <span className="text-sm font-semibold text-slate-500">{idx + 1} / {TOTAL}</span>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full
            ${STATUS_STYLE[word?.status] ?? STATUS_STYLE.new}`}>
            {word?.status ?? 'new'}
          </span>
        </div>

        {/* Kategori filtresi */}
        <CategoryBar />

        {/* İlerleme barı */}
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-5">
          <div className="h-full bg-cyan-500 rounded-full transition-all duration-500"
               style={{ width: `${progressPct}%` }} />
        </div>

        <div className="flex flex-col flex-1">

          {/* ── 3D Flip Kart ─────────────────────────────── */}
          <div
            className="flex-1 relative"
            style={{ perspective: '1200px', minHeight: '280px' }}
          >
            {/* Dönen iç katman */}
            <div
              className="absolute inset-0"
              style={{
                transformStyle: 'preserve-3d',
                WebkitTransformStyle: 'preserve-3d',
                transition: 'transform 0.55s ease',
                transform: phase === 'back' ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >

              {/* ── ÖN YÜZ ─────────────────────────────── */}
              <div
                className="bg-white rounded-2xl border border-slate-200 shadow-sm
                           flex flex-col items-center justify-center p-8 cursor-pointer select-none"
                style={FACE_BASE}
                onClick={() => setPhase('back')}
              >
                {word?.emoji && (
                  <div className="text-6xl mb-5">{word.emoji}</div>
                )}
                <div
                  className="text-5xl font-black text-slate-900 text-center leading-tight"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {word?.tr}
                </div>
                <div className="text-xs text-slate-400 mt-auto pt-6">
                  Kartı çevirmek için tıkla ↩
                </div>
              </div>

              {/* ── ARKA YÜZ ───────────────────────────── */}
              <div
                className="bg-white rounded-2xl border border-cyan-200 shadow-sm
                           flex flex-col items-center justify-center p-8 select-none"
                style={{ ...FACE_BASE, transform: 'rotateY(180deg)' }}
              >
                {word?.emoji && (
                  <div className="text-3xl mb-1">{word.emoji}</div>
                )}
                <div className="text-sm font-medium text-slate-400 mb-1">
                  {word?.tr}
                </div>
                <div className="text-xs text-slate-300 mb-5">
                  {LANG_FLAGS[targetLang]} {LANG_NAMES[targetLang]}
                </div>
                <div
                  className="text-4xl font-black text-slate-900 text-center mb-5"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {word?.[targetLang] ?? '—'}
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    word && playAudio(`/audio/${targetLang}/${audioFilename(word[targetLang])}.mp3`)
                  }}
                  className="w-12 h-12 rounded-full bg-teal-500 hover:bg-teal-600
                             flex items-center justify-center text-xl text-white
                             shadow-sm transition-colors"
                  title="Çeviriyi seslendir"
                >
                  🔊
                </button>
              </div>

            </div>
          </div>

          {/* ── Butonlar — arka yüze geçince görünür ──── */}
          <div
            className="mt-5 transition-opacity duration-300"
            style={{
              opacity: phase === 'back' ? 1 : 0,
              pointerEvents: phase === 'back' ? 'auto' : 'none',
            }}
          >
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                onClick={() => handleAnswer(false, 2)}
                className="py-4 bg-red-50 border-2 border-red-200 hover:bg-red-100
                           text-red-700 font-bold rounded-2xl transition-all active:scale-95"
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

            <button
              onClick={() => navigate('/scenarios')}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500
                         hover:from-cyan-600 hover:to-blue-600 text-white font-bold
                         text-sm rounded-2xl transition-all active:scale-95
                         flex items-center justify-center gap-2 shadow-md"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              🤖 ChatBot ile Pratik Yap
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
