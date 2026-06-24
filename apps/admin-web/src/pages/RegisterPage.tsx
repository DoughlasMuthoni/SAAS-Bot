import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../lib/auth'

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: '', orgName: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    setError('')
    try {
      await register(form.fullName, form.email, form.password, form.orgName)
      navigate('/dashboard')
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const HOME_URL = (import.meta as any).env?.VITE_HOME_URL || 'http://localhost:3002'

  const EyeIcon = ({ open }: { open: boolean }) => open
    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* ── White header ── */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        height: 58,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,0,0,.05)',
      }}>
        <a href={HOME_URL} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/logo.jpeg" alt="DG ChatBot" style={{ height: 30, width: 'auto', objectFit: 'contain', borderRadius: 5 }} />
        </a>
        <Link to="/login" style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          Already have an account? Sign in
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>
      </header>

      {/* ── Dark gradient main ── */}
      <main style={{
        flex: 1,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem',
      }}>
        <div className="cb-login-card" style={{ maxWidth: 460 }}>

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
            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 4 }}>Create your free account</div>
            <p style={{ fontSize: 13, opacity: .8, margin: 0 }}>Set up your workspace and deploy your first AI chatbot in minutes.</p>
          </div>

          {/* Form */}
          <div className="cb-login-body">
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: 13 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-medium" style={{ fontSize: 13 }}>Full Name</label>
                  <input className="form-control" value={form.fullName} onChange={set('fullName')} placeholder="Jane Smith" required autoFocus />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-medium" style={{ fontSize: 13 }}>Company / Organisation</label>
                  <input className="form-control" value={form.orgName} onChange={set('orgName')} placeholder="Acme Inc." required />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-medium" style={{ fontSize: 13 }}>Work Email</label>
                <input type="email" className="form-control" value={form.email} onChange={set('email')} placeholder="jane@acme.com" required />
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-medium" style={{ fontSize: 13 }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw ? 'text' : 'password'}
                      className="form-control"
                      value={form.password}
                      onChange={set('password')}
                      placeholder="Min. 8 characters"
                      required
                      style={{ paddingRight: 40 }}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}>
                      <EyeIcon open={showPw} />
                    </button>
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-medium" style={{ fontSize: 13 }}>Confirm Password</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="form-control"
                    value={form.confirm}
                    onChange={set('confirm')}
                    placeholder="Repeat password"
                    required
                  />
                </div>
              </div>

              <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginBottom: 12, lineHeight: 1.6 }}>
                By creating an account you agree to our{' '}
                <Link to="/terms" style={{ color: '#6b7280', textDecoration: 'underline' }}>Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" style={{ color: '#6b7280', textDecoration: 'underline' }}>Privacy Policy</Link>.
              </p>

              <button type="submit" className="btn btn-primary w-100" disabled={loading} style={{ padding: '10px', fontWeight: 600, fontSize: 14, borderRadius: 10 }}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span className="spinner-border spinner-border-sm" role="status" />
                    Creating account…
                  </span>
                ) : 'Create free account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', marginTop: '1.25rem', marginBottom: 0 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>
        </div>
      </main>

      {/* ── White footer ── */}
      <footer style={{
        background: '#fff',
        borderTop: '1px solid #e2e8f0',
        padding: '16px 24px',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 8 }}>
          <Link to="/privacy" style={{ fontSize: 12, color: '#64748b', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Privacy Policy
          </Link>
          <span style={{ color: '#cbd5e1', fontSize: 14 }}>·</span>
          <Link to="/terms" style={{ fontSize: 12, color: '#64748b', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Terms of Service
          </Link>
          <span style={{ color: '#cbd5e1', fontSize: 14 }}>·</span>
          <Link to="/security" style={{ fontSize: 12, color: '#64748b', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            Security
          </Link>
        </div>
        <p style={{ fontSize: 11.5, color: '#94a3b8', margin: 0 }}>
          © {new Date().getFullYear()} Douglas Githui Creatives. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
