import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const PIN_KEY = 'aguilang_parent_pin'
const DEFAULT_PIN = '1234'

const btnStyle = {
  height: '64px',
  background: '#F8FAFC',
  border: '1px solid #E2E8F0',
  borderRadius: '14px',
  fontSize: '22px',
  fontWeight: '600',
  color: '#0F172A',
  cursor: 'pointer',
}

export default function ParentGate() {
  const navigate = useNavigate()
  const [digits, setDigits] = useState([])
  const [shake, setShake] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const storedPin = () => localStorage.getItem(PIN_KEY) || DEFAULT_PIN

  const handlePress = (num) => {
    if (digits.length >= 4 || shake) return
    const next = [...digits, num]
    setDigits(next)

    if (next.length === 4) {
      if (next.join('') === storedPin()) {
        navigate('/settings/panel')
      } else {
        setShake(true)
        setErrorMsg('Wrong PIN')
        setTimeout(() => {
          setShake(false)
          setErrorMsg('')
          setDigits([])
        }, 650)
      }
    }
  }

  const handleBackspace = () => {
    if (shake) return
    setDigits(d => d.slice(0, -1))
    setErrorMsg('')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8FAFC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      padding: '24px',
    }}>
      <style>{`
        @keyframes pin-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60%  { transform: translateX(-10px); }
          40%, 80%  { transform: translateX(10px); }
        }
      `}</style>

      <div style={{
        background: 'white',
        borderRadius: '20px',
        border: '1px solid #E2E8F0',
        padding: '40px 32px',
        width: '100%',
        maxWidth: '360px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        textAlign: 'center',
        animation: shake ? 'pin-shake 0.65s ease' : 'none',
      }}>

        {/* Logo */}
        <div style={{ fontSize: '40px', marginBottom: '8px' }}>🦅</div>
        <div style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '22px', fontWeight: '800', color: '#0F172A', marginBottom: '4px',
        }}>
          AguiLangEvo
        </div>
        <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '32px' }}>
          Parent Panel
        </div>

        {/* PIN dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '8px' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: i < digits.length
                ? (shake ? '#EF4444' : '#0891B2')
                : '#E2E8F0',
              transition: 'background 0.15s',
            }} />
          ))}
        </div>

        {/* Error */}
        <div style={{
          height: '20px',
          fontSize: '13px',
          color: '#EF4444',
          fontWeight: '600',
          marginBottom: '24px',
        }}>
          {errorMsg}
        </div>

        {/* Number pad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button key={n} onClick={() => handlePress(String(n))} style={btnStyle}>
              {n}
            </button>
          ))}
          <button
            onClick={handleBackspace}
            style={{ ...btnStyle, background: '#F1F5F9', color: '#64748B', fontSize: '20px' }}
          >
            ←
          </button>
          <button onClick={() => handlePress('0')} style={btnStyle}>
            0
          </button>
          <div />
        </div>

        <div style={{ marginTop: '24px', fontSize: '12px', color: '#CBD5E1' }}>
          Default PIN: 1234
        </div>
      </div>
    </div>
  )
}
