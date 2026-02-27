import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useTheme } from '../context/useTheme'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function LoginPage() {
  const { user, login } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/home" replace />

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Email and password are required.'); return }
    setLoading(true)
    try {
      const { data } = await axios.post(`${API_URL}/api/login`, form)
      login(data.token)
      navigate('/home', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials.')
    } finally {
      setLoading(false)
    }
  }

  const isDark = theme === 'dark'

  return (
    <div style={styles.root}>
      {/* Theme toggle */}
      <button onClick={toggle} style={styles.themeBtn} title="Toggle theme" aria-label="Toggle theme">
        {isDark ? '☀' : '◑'}
      </button>

      <div style={styles.card}>
        {/* Terminal header bar */}
        <div style={styles.termBar}>
          <div style={styles.termDots}>
            <span style={{ ...styles.termDot, background: '#ff5f57' }} />
            <span style={{ ...styles.termDot, background: '#febc2e' }} />
            <span style={{ ...styles.termDot, background: '#28c840' }} />
          </div>
          <span style={styles.termTitle}>ipgeo — auth</span>
          <span style={{ width: 52 }} />
        </div>

        <div style={styles.cardBody}>
          {/* Prompt line */}
          <div style={styles.promptRow}>
            <span style={styles.promptSymbol}>$</span>
            <span style={styles.promptText}>ipgeo login</span>
            <span style={styles.cursor} />
          </div>

          <h1 style={styles.title}>Sign in</h1>
          <p style={styles.subtitle}>Enter your credentials to access the dashboard.</p>

          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            <div style={styles.field}>
              <label style={styles.label}>
                <span style={styles.labelPrefix}>--</span>email
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="user@example.com"
                style={styles.input}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                <span style={styles.labelPrefix}>--</span>password
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                style={styles.input}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={styles.errorBox}>
                <span style={styles.errorTag}>ERR</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ ...styles.btn, opacity: loading ? 0.6 : 1 }}
            >
              {loading
                ? <><span style={styles.btnSpinner} /> Authenticating…</>
                : '$ authenticate →'
              }
            </button>
          </form>
        </div>
      </div>

      <p style={styles.footer}>IP Geolocation Dashboard · Internal Tool</p>

      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes blink  { 0%,100%{opacity:1}50%{opacity:0} }
        input:focus { outline: none; border-color: var(--accent) !important; box-shadow: 0 0 0 3px var(--accent-dim); }
        button:active { transform: scale(0.98); }
      `}</style>
    </div>
  )
}

const styles = {
  root: {
    minHeight: '100vh',
    background: 'var(--bg)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    position: 'relative',
    transition: 'background 0.2s',
  },
  themeBtn: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-dim)',
    width: '36px',
    height: '36px',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-sm)',
    transition: 'all 0.15s',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-lg)',
  },
  termBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border)',
  },
  termDots: { display: 'flex', gap: '6px' },
  termDot:  { width: '12px', height: '12px', borderRadius: '50%', display: 'block' },
  termTitle: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    color: 'var(--text-muted)',
    letterSpacing: '0.04em',
  },
  cardBody: { padding: '28px 28px 32px' },
  promptRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '20px',
  },
  promptSymbol: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    color: 'var(--accent)',
    fontWeight: '500',
  },
  promptText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  cursor: {
    display: 'inline-block',
    width: '8px',
    height: '14px',
    background: 'var(--accent)',
    borderRadius: '1px',
    animation: 'blink 1.1s step-end infinite',
    opacity: 0.8,
  },
  title: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '22px',
    fontWeight: '600',
    color: 'var(--text)',
    letterSpacing: '-0.3px',
    marginBottom: '6px',
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginBottom: '24px',
    lineHeight: 1.5,
  },
  form:  { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    color: 'var(--text-dim)',
    letterSpacing: '0.04em',
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  labelPrefix: { color: 'var(--accent)', opacity: 0.7 },
  input: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '11px 14px',
    color: 'var(--text)',
    fontSize: '14px',
    fontFamily: "'JetBrains Mono', monospace",
    transition: 'border-color 0.15s, box-shadow 0.15s',
    width: '100%',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15)',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'var(--error-dim)',
    border: '1px solid var(--error-border)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: 'var(--error)',
    fontSize: '13px',
    fontFamily: "'JetBrains Mono', monospace",
  },
  errorTag: {
    background: 'var(--error)',
    color: 'var(--bg)',
    fontSize: '9px',
    fontWeight: '700',
    letterSpacing: '0.08em',
    padding: '2px 6px',
    borderRadius: '4px',
    flexShrink: 0,
  },
  btn: {
    marginTop: '4px',
    background: 'var(--accent)',
    color: 'var(--accent-text)',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: '0.02em',
    cursor: 'pointer',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 2px 8px var(--accent-dim)',
    transition: 'opacity 0.15s, transform 0.1s',
  },
  btnSpinner: {
    display: 'inline-block',
    width: '12px',
    height: '12px',
    border: '2px solid rgba(0,0,0,0.2)',
    borderTopColor: 'var(--accent-text)',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  footer: {
    marginTop: '24px',
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontFamily: "'JetBrains Mono', monospace",
    opacity: 0.6,
    letterSpacing: '0.03em',
  },
}