/**
 * Dictation.jsx — "Dikte & Kayıt" telaffuz aracı
 *
 * Kullanıcı bir cümle için:
 *  1) 🔊 Doğru sesi dinler (model)
 *  2) 🎤 Dikte eder → söylediği metne dönüşür + hedefle karşılaştırılır
 *  3) 🔴 Kendi sesini kaydeder → ▶️ dinleyip modelle karşılaştırır
 *
 * Not: STT ve kayıt aynı anda mikrofonu paylaşamaz → ayrı butonlar.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../core/langState'
import { TARGET_LANGS } from '../core/languages'
import { useSpeech } from '../hooks/useSpeech'
import { getPronunciationScore } from '../utils/fuzzyMatch'
import { collectSentences } from '../data/sentenceBank'
import { startRecording, stopRecording, isRecordingSupported } from '../core/recorder'
import { addXp } from '../core/progressStore'
import * as sfx from '../core/sfx'

const shuffle = (a) => [...a].sort(() => Math.random() - 0.5)

export default function Dictation() {
  const navigate = useNavigate()
  const [lang] = useLang()
  const { speak, startListening, stopListening, isListening, transcript, sttSupported } = useSpeech(lang)

  const [pool, setPool]   = useState([])
  const [loading, setLoading] = useState(true)
  const [queue, setQueue] = useState([])
  const [qi, setQi]       = useState(0)

  const [dictResult, setDictResult] = useState(null) // { score, text }
  const [recording, setRecording]   = useState(false)
  const [recUrl, setRecUrl]         = useState(null)
  const [listenedFlag, setListenedFlag] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    collectSentences(lang, { maxW: 9 }).then(s => { if (alive) { setPool(s); setLoading(false) } })
    return () => { alive = false }
  }, [lang])

  const item = queue[qi]

  const start = () => {
    setQueue(shuffle(pool).slice(0, 10)); setQi(0)
    setDictResult(null); setRecUrl(null); setListenedFlag(false)
  }

  // Yeni cümlede sıfırla
  useEffect(() => { setDictResult(null); setRecUrl(null); setListenedFlag(false) }, [qi])

  // ── Dikte: STT sonucu geldiğinde değerlendir ──
  useEffect(() => {
    if (!transcript || isListening || !item || listenedFlag) return
    setListenedFlag(true)
    const r = getPronunciationScore(transcript, item.target)
    setDictResult({ score: r.score, text: transcript })
    if (r.score >= 55) { sfx.correct(); addXp(4) } else sfx.wrong()
  }, [transcript, isListening]) // eslint-disable-line

  const handleDictate = () => {
    if (isListening) { stopListening(); return }
    setDictResult(null); setListenedFlag(false)
    startListening()
  }

  const handleRecord = async () => {
    if (recording) {
      const url = await stopRecording()
      setRecUrl(url); setRecording(false)
    } else {
      setRecUrl(null)
      try { await startRecording(); setRecording(true) }
      catch { setRecording(false) }
    }
  }

  const playRec = () => { if (recUrl) { try { new Audio(recUrl).play() } catch { /* yoksay */ } } }

  const next = () => {
    if (qi + 1 >= queue.length) { sfx.reward(); setQueue([]) }
    else setQi(i => i + 1)
  }

  // ── Giriş / bitiş ──
  if (!queue.length) {
    return (
      <div style={S.page}>
        <Header onBack={() => navigate('/learn-hub')} lang={lang} />
        <div style={{ ...S.body, alignItems: 'center', textAlign: 'center', paddingTop: 36 }}>
          <div style={{ fontSize: 60 }}>📝</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Dikte & Kayıt</div>
          <div style={{ fontSize: 15, color: '#64748B', maxWidth: 330, lineHeight: 1.6 }}>
            Doğru sesi dinle, sonra <b>dikte et</b> (söylediğin yazıya dönüşür) veya
            <b> kaydet</b> ve kendini dinle. Telaffuzunu geliştir! 🎤
          </div>
          <button onClick={start} disabled={loading || !pool.length}
            style={{ ...S.primary, opacity: loading || !pool.length ? 0.5 : 1, maxWidth: 280 }}>
            {loading ? 'Yükleniyor...' : `Başla (${pool.length} cümle)`}
          </button>
        </div>
      </div>
    )
  }

  const lvl = dictResult ? (dictResult.score >= 80 ? { c: '#15803D', bg: '#F0FDF4', bd: '#BBF7D0', t: 'Mükemmel' }
                        : dictResult.score >= 55 ? { c: '#0369A1', bg: '#EFF8FF', bd: '#BAE6FD', t: 'İyi' }
                        : { c: '#92400E', bg: '#FEF3C7', bd: '#FDE68A', t: 'Tekrar dene' }) : null

  return (
    <div style={S.page}>
      <Header onBack={() => setQueue([])} lang={lang} right={`${qi + 1}/${queue.length}`} />
      <div style={S.body}>
        {/* Hedef cümle */}
        <div style={S.card}>
          <button onClick={() => speak(item.target)} style={S.play}>🔊 Doğru sesi dinle</button>
          <div style={S.target}>{item.target}</div>
          <div style={S.tr}>{item.tr}</div>
        </div>

        {/* 1) DİKTE (STT → metin) */}
        <div style={S.section}>
          <div style={S.secLabel}>🎤 Dikte et — söyle, yazıya dönüşsün</div>
          {sttSupported ? (
            <button onClick={handleDictate}
              style={{ ...S.act, background: isListening ? '#FEE2E2' : '#0891B2',
                       color: isListening ? '#DC2626' : 'white' }}>
              {isListening ? '🔴 Dinliyorum... (durdurmak için dokun)' : '🎤 Dikte Et'}
            </button>
          ) : (
            <div style={S.warn}>⚠️ Bu cihazda ses tanıma desteklenmiyor</div>
          )}
          {isListening && transcript && <div style={S.live}>“{transcript}”</div>}
          {dictResult && (
            <div style={{ ...S.result, background: lvl.bg, borderColor: lvl.bd, color: lvl.c }}>
              <div style={{ fontSize: 13, opacity: 0.8 }}>Dikte: “{dictResult.text}”</div>
              <div style={{ fontWeight: 800, marginTop: 2 }}>{lvl.t} · %{dictResult.score}{dictResult.score >= 55 ? ' · +4 XP' : ''}</div>
            </div>
          )}
        </div>

        {/* 2) KAYIT (kendi sesini dinle) */}
        {isRecordingSupported() && (
          <div style={S.section}>
            <div style={S.secLabel}>🔴 Kaydet — kendini dinle, modelle karşılaştır</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleRecord}
                style={{ ...S.act, flex: 1, background: recording ? '#FEE2E2' : '#F0FDF4',
                         color: recording ? '#DC2626' : '#15803D',
                         border: `1.5px solid ${recording ? '#FCA5A5' : '#BBF7D0'}` }}>
                {recording ? '⏹ Durdur' : '🔴 Kaydet'}
              </button>
              {recUrl && !recording && (
                <button onClick={playRec} style={{ ...S.act, flex: 1, background: '#EFF8FF', color: '#0891B2', border: '1.5px solid #BAE6FD' }}>
                  ▶️ Kaydımı dinle
                </button>
              )}
            </div>
          </div>
        )}

        <button onClick={next} style={S.primary}>
          {qi + 1 >= queue.length ? 'Bitir 🏁' : 'Sıradaki →'}
        </button>
      </div>
    </div>
  )
}

function Header({ onBack, right, lang }) {
  return (
    <div style={S.header}>
      <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={S.back}>←</button>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
          📝 Dikte & Kayıt <span style={{ color: '#94A3B8', fontWeight: 500 }}>· {TARGET_LANGS[lang]?.flag}</span>
        </div>
        {right && <div style={S.counter}>{right}</div>}
      </div>
    </div>
  )
}

const S = {
  page: { minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  header: { background: 'white', borderBottom: '1px solid #E2E8F0', padding: '12px 18px', position: 'sticky', top: 0, zIndex: 10 },
  back: { background: '#F1F5F9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16 },
  counter: { background: '#EFF8FF', borderRadius: 8, padding: '4px 12px', fontSize: 13, fontWeight: 700, color: '#0891B2' },
  body: { maxWidth: 560, margin: '0 auto', padding: '22px 24px 48px', display: 'flex', flexDirection: 'column', gap: 14 },
  card: { background: 'white', border: '1px solid #E2E8F0', borderRadius: 16, padding: 22, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  play: { background: '#EFF8FF', border: '1.5px solid #BAE6FD', color: '#0891B2', borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  target: { fontSize: 21, fontWeight: 800, color: '#0F172A' },
  tr: { fontSize: 14, color: '#94A3B8' },
  section: { background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 },
  secLabel: { fontSize: 12, fontWeight: 800, color: '#475569' },
  act: { height: 48, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', width: '100%' },
  live: { fontSize: 15, color: '#0891B2', fontStyle: 'italic', textAlign: 'center', fontWeight: 600 },
  result: { border: '1px solid', borderRadius: 10, padding: '10px 12px', textAlign: 'center' },
  warn: { background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', borderRadius: 10, padding: '10px 12px', fontSize: 13, fontWeight: 600, textAlign: 'center' },
  primary: { height: 52, background: '#0891B2', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, color: 'white', cursor: 'pointer', width: '100%', marginTop: 4 },
}
