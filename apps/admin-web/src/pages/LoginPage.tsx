import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../lib/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      setError('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="cb-login-wrap">
      <div className="cb-login-card">
        {/* Brand header */}
        <div className="cb-login-top">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <div style={{
              background: '#fff', borderRadius: 12, padding: '8px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img src="/logo.jpeg" alt="Douglas Githui Tech Creatives" style={{ height: 44, width: 'auto', objectFit: 'contain', display: 'block' }} />
            </div>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 4 }}>DG ChatBot — Admin</div>
          <p style={{ fontSize: 13, opacity: .8, margin: 0 }}>
            Sign in to manage your AI chatbots
          </p>
        </div>

        {/* Form */}
        <div className="cb-login-body">
          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-4" style={{ fontSize: 13 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-medium" style={{ fontSize: 13 }}>Email address</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="form-label fw-medium" style={{ fontSize: 13 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0,
                  }}
                  tabIndex={-1}
                >
                  {showPw
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
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
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', marginTop: '1.25rem', marginBottom: 0 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
