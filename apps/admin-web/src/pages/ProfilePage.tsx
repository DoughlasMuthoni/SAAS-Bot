import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../lib/auth'
import api from '../lib/api'

interface ProfileBody {
  full_name?: string
  email?: string
  current_password?: string
  new_password?: string
}

interface UserMeResponse {
  id: string
  email: string
  full_name: string
  role: string
  org_id: string
  is_active: boolean
  is_superadmin: boolean
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const queryClient = useQueryClient()

  // Profile info form
  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [email, setEmail]       = useState(user?.email ?? '')
  const [infoMsg, setInfoMsg]   = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password form
  const [currentPw, setCurrentPw]   = useState('')
  const [newPw, setNewPw]           = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [pwMsg, setPwMsg]           = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (user) { setFullName(user.full_name); setEmail(user.email) }
  }, [user])

  const updateProfile = useMutation({
    mutationFn: (body: ProfileBody) =>
      api.put<UserMeResponse>('/auth/profile', body).then(r => r.data),
    onSuccess: (data) => {
      setUser(data)
      queryClient.invalidateQueries({ queryKey: ['me'] })
      setInfoMsg({ type: 'success', text: 'Profile updated successfully.' })
    },
    onError: (e: any) =>
      setInfoMsg({ type: 'error', text: e?.response?.data?.detail || 'Failed to update profile.' }),
  })

  const changePassword = useMutation({
    mutationFn: (body: ProfileBody) =>
      api.put<UserMeResponse>('/auth/profile', body).then(r => r.data),
    onSuccess: () => {
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setPwMsg({ type: 'success', text: 'Password changed successfully.' })
    },
    onError: (e: any) =>
      setPwMsg({ type: 'error', text: e?.response?.data?.detail || 'Failed to change password.' }),
  })

  const submitInfo = (e: React.FormEvent) => {
    e.preventDefault()
    setInfoMsg(null)
    if (!fullName.trim()) { setInfoMsg({ type: 'error', text: 'Full name cannot be blank.' }); return }
    if (!email.trim())    { setInfoMsg({ type: 'error', text: 'Email cannot be blank.' }); return }
    updateProfile.mutate({ full_name: fullName.trim(), email: email.trim() })
  }

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg(null)
    if (!currentPw)      { setPwMsg({ type: 'error', text: 'Enter your current password.' }); return }
    if (newPw.length < 8){ setPwMsg({ type: 'error', text: 'New password must be at least 8 characters.' }); return }
    if (newPw !== confirmPw){ setPwMsg({ type: 'error', text: 'New passwords do not match.' }); return }
    changePassword.mutate({ current_password: currentPw, new_password: newPw })
  }

  const initials = (user?.full_name ?? user?.email ?? '?')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>

      {/* Header */}
      <div className="mb-4">
        <h4 style={{ fontWeight: 800, color: '#0f172a', margin: 0 }}>My Profile</h4>
        <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>
          Update your name, email address, and password.
        </p>
      </div>

      {/* Avatar + role badge */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg,#16a34a,#15803d)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0,
        }}>
          {initials}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>{user?.full_name}</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>{user?.email}</div>
          <span style={{
            display: 'inline-block', marginTop: 4,
            background: '#f0fdf4', color: '#15803d',
            fontSize: 11, fontWeight: 700, padding: '2px 10px',
            borderRadius: 99, textTransform: 'capitalize', letterSpacing: '.04em',
          }}>
            {user?.role}{user?.is_superadmin ? ' · Superadmin' : ''}
          </span>
        </div>
      </div>

      {/* ── Profile info ── */}
      <div className="card mb-4">
        <div className="card-header bg-white border-bottom py-3 px-4">
          <h6 className="mb-0 fw-700" style={{ fontWeight: 700 }}>Profile Information</h6>
        </div>
        <div className="card-body p-4">
          {infoMsg && (
            <div className={`alert alert-${infoMsg.type === 'success' ? 'success' : 'danger'} py-2 small mb-3`}>
              {infoMsg.text}
            </div>
          )}
          <form onSubmit={submitInfo}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Full Name</label>
              <input
                type="text"
                className="form-control"
                value={fullName}
                onChange={e => { setFullName(e.target.value); setInfoMsg(null) }}
                placeholder="Your full name"
                required
              />
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold">Email Address</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={e => { setEmail(e.target.value); setInfoMsg(null) }}
                placeholder="you@example.com"
                required
              />
              <div className="form-text">Changing your email will require you to log in again with the new address.</div>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>

      {/* ── Change password ── */}
      <div className="card mb-4">
        <div className="card-header bg-white border-bottom py-3 px-4">
          <h6 className="mb-0" style={{ fontWeight: 700 }}>Change Password</h6>
        </div>
        <div className="card-body p-4">
          {pwMsg && (
            <div className={`alert alert-${pwMsg.type === 'success' ? 'success' : 'danger'} py-2 small mb-3`}>
              {pwMsg.text}
            </div>
          )}
          <form onSubmit={submitPassword}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Current Password</label>
              <input
                type="password"
                className="form-control"
                value={currentPw}
                onChange={e => { setCurrentPw(e.target.value); setPwMsg(null) }}
                placeholder="Enter current password"
                autoComplete="current-password"
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">New Password</label>
              <input
                type="password"
                className="form-control"
                value={newPw}
                onChange={e => { setNewPw(e.target.value); setPwMsg(null) }}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold">Confirm New Password</label>
              <input
                type="password"
                className={`form-control ${confirmPw && confirmPw !== newPw ? 'is-invalid' : ''}`}
                value={confirmPw}
                onChange={e => { setConfirmPw(e.target.value); setPwMsg(null) }}
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
              {confirmPw && confirmPw !== newPw && (
                <div className="invalid-feedback">Passwords do not match</div>
              )}
            </div>
            <button
              type="submit"
              className="btn btn-outline-primary"
              disabled={changePassword.isPending}
            >
              {changePassword.isPending ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      {/* ── Account info (read-only) ── */}
      <div className="card">
        <div className="card-header bg-white border-bottom py-3 px-4">
          <h6 className="mb-0" style={{ fontWeight: 700 }}>Account Details</h6>
        </div>
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-sm-6">
              <div className="small text-muted mb-1">Account ID</div>
              <div className="font-monospace small text-truncate" style={{ color: '#374151' }}>{user?.id}</div>
            </div>
            <div className="col-sm-6">
              <div className="small text-muted mb-1">Organisation ID</div>
              <div className="font-monospace small text-truncate" style={{ color: '#374151' }}>{user?.org_id}</div>
            </div>
            <div className="col-sm-6">
              <div className="small text-muted mb-1">Role</div>
              <div className="fw-semibold small" style={{ color: '#374151', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
            <div className="col-sm-6">
              <div className="small text-muted mb-1">Account Status</div>
              <span style={{
                display: 'inline-block',
                background: user?.is_active ? '#f0fdf4' : '#fef2f2',
                color: user?.is_active ? '#15803d' : '#dc2626',
                fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 99,
              }}>
                {user?.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
