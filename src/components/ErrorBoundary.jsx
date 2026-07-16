import { Component } from 'react'

/**
 * ErrorBoundary — bir bileşen render sırasında hata verirse beyaz sayfa
 * yerine anlaşılır bir ekran gösterir (uygulama tamamen ölmez).
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Geliştirme için konsola yaz
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', background: '#F8FAFC', display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 32, textAlign: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🦅</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
            Bir şeyler ters gitti
          </div>
          <div style={{ fontSize: 14, color: '#64748B', maxWidth: 320, lineHeight: 1.6, marginBottom: 20 }}>
            Uygulama bu ekranda bir hata ile karşılaştı. Endişelenme, ilerlemen kayıtlı.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => { this.setState({ error: null }); window.location.hash = '#/dashboard'; window.location.reload() }}
              style={{ padding: '12px 24px', background: '#0891B2', color: 'white', border: 'none',
                       borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
            >
              🏠 Panele Dön
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '12px 24px', background: '#F1F5F9', color: '#475569', border: 'none',
                       borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
            >
              🔄 Yenile
            </button>
          </div>
          {import.meta.env.DEV && (
            <pre style={{ marginTop: 20, fontSize: 11, color: '#94A3B8', maxWidth: 340, overflow: 'auto', textAlign: 'left' }}>
              {String(this.state.error?.message || this.state.error)}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
