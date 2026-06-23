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

  const EyeIcon = ({ open }: { open: boolean }) => open
    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>

  return (
    <div className="cb-login-wrap">
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
    </div>
  )
}
