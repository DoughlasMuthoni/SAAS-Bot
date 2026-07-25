import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'

const HOME_URL = (import.meta as any).env?.VITE_HOME_URL || 'http://localhost:3002'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0', height: 58, flexShrink: 0,
        display: 'flex', alignItems: 'center', padding: '0 24px',
        justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,.05)',
      }}>
        <a href={HOME_URL} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/logo.jpeg" alt="DG ChatBot" style={{ height: 30, width: 'auto', objectFit: 'contain', borderRadius: 5 }} />
        </a>
        <Link to="/login" style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}>
          ← Back to sign in
        </Link>
      </header>

      {/* Main */}
      <main style={{
        flex: 1,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem',
      }}>
        <div className="cb-login-card">
          <div className="cb-login-top">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <div style={{ background: '#fff', borderRadius: 12, padding: '8px 18px' }}>
                <img src="/logo.jpeg" alt="DG ChatBot" style={{ height: 44, width: 'auto', objectFit: 'contain', display: 'block' }} />
              </div>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 4 }}>Forgot your password?</div>
            <p style={{ fontSize: 13, opacity: .8, margin: 0 }}>
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          <div className="cb-login-body">
            {sent ? (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', marginBottom: 8 }}>Check your inbox</div>
                <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.65, marginBottom: 20 }}>
                  If an account with <strong>{email}</strong> exists, a reset link has been sent.
                  Check your spam folder if you don't see it within a few minutes.
                </p>
                <Link to="/login" style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}>
                  ← Back to sign in
                </Link>
              </div>
            ) : (
              <>
                {error && (
                  <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-4" style={{ fontSize: 13 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="form-label fw-medium" style={{ fontSize: 13 }}>Email address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                    style={{ padding: '10px', fontWeight: 600, fontSize: 14, borderRadius: 10 }}
                  >
                    {loading ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <span className="spinner-border spinner-border-sm" role="status" />
                        Sending…
                      </span>
                    ) : 'Send reset link'}
                  </button>
                </form>
                <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', marginTop: '1.25rem', marginBottom: 0 }}>
                  Remembered it?{' '}
                  <Link to="/login" style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: '#fff', borderTop: '1px solid #e2e8f0', padding: '12px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 11.5, color: '#94a3b8', margin: 0 }}>
          © {new Date().getFullYear()} Douglas Githui Creatives. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
