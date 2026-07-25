import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'

const HOME_URL = (import.meta as any).env?.VITE_HOME_URL || 'http://localhost:3002'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  if (!token) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a,#1e293b)', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="cb-login-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Invalid link</div>
          <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 20 }}>This reset link is missing a token. Please request a new one.</p>
          <Link to="/forgot-password" style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none', fontSize: 13 }}>
            Request a new reset link →
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/reset-password', { token, new_password: password })
      setDone(true)
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'This link is invalid or has expired. Please request a new one.')
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
            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 4 }}>Set a new password</div>
            <p style={{ fontSize: 13, opacity: .8, margin: 0 }}>
              Choose a strong password for your account.
            </p>
          </div>

          <div className="cb-login-body">
            {done ? (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', marginBottom: 8 }}>Password updated!</div>
                <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.65, marginBottom: 20 }}>
                  Your password has been reset. You can now sign in with your new password.
                </p>
                <button
                  className="btn btn-primary w-100"
                  style={{ fontWeight: 600, fontSize: 14, borderRadius: 10, padding: '10px' }}
                  onClick={() => navigate('/login')}
                >
                  Sign in →
                </button>
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
                  <div className="mb-3">
                    <label className="form-label fw-medium" style={{ fontSize: 13 }}>New password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPw ? 'text' : 'password'}
                        className="form-control"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        required
                        autoFocus
                        style={{ paddingRight: 40 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(v => !v)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}
                        tabIndex={-1}
                      >
                        {showPw
                          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        }
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-medium" style={{ fontSize: 13 }}>Confirm new password</label>
                    <input
                      type={showPw ? 'text' : 'password'}
                      className="form-control"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Re-enter your password"
                      required
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
                        Updating…
                      </span>
                    ) : 'Update password'}
                  </button>
                </form>
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
