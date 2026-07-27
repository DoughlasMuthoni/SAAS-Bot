import { useState, useEffect, useRef } from 'react'
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
  avatar_url: string | null
  plan: string
  is_superadmin: boolean
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isPaidPlan = user?.plan && user.plan !== 'free'

  // Profile info form
  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [email, setEmail]       = useState(user?.email ?? '')
  const [infoMsg, setInfoMsg]   = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password form
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw]         = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwMsg, setPwMsg]         = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Avatar
  const [avatarMsg, setAvatarMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url ?? null)

  useEffect(() => {
    if (user) {
      setFullName(user.full_name)
      setEmail(user.email)
      setAvatarPreview(user.avatar_url ?? null)
    }
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

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return api.post<UserMeResponse>('/auth/profile/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(r => r.data)
    },
    onSuccess: (data) => {
      setUser(data)
      setAvatarPreview(data.avatar_url)
      queryClient.invalidateQueries({ queryKey: ['me'] })
      setAvatarMsg({ type: 'success', text: 'Profile photo updated.' })
    },
    onError: (e: any) =>
      setAvatarMsg({ type: 'error', text: e?.response?.data?.detail || 'Upload failed.' }),
  })

  const removeAvatar = useMutation({
    mutationFn: () => api.delete<UserMeResponse>('/auth/profile/avatar').then(r => r.data),
    onSuccess: (data) => {
      setUser(data)
      setAvatarPreview(null)
      queryClient.invalidateQueries({ queryKey: ['me'] })
      setAvatarMsg({ type: 'success', text: 'Profile photo removed.' })
    },
    onError: (e: any) =>
      setAvatarMsg({ type: 'error', text: e?.response?.data?.detail || 'Failed to remove photo.' }),
  })

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarMsg(null)
    // Local preview immediately
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
    uploadAvatar.mutate(file)
    e.target.value = ''
  }

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
    if (!currentPw)        { setPwMsg({ type: 'error', text: 'Enter your current password.' }); return }
    if (newPw.length < 8)  { setPwMsg({ type: 'error', text: 'New password must be at least 8 characters.' }); return }
    if (newPw !== confirmPw){ setPwMsg({ type: 'error', text: 'Passwords do not match.' }); return }
    changePassword.mutate({ current_password: currentPw, new_password: newPw })
  }

  const initials = (user?.full_name || user?.email || '?')
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

      {/* ── Avatar section ── */}
      <div className="card mb-4">
        <div className="card-header bg-white border-bottom py-3 px-4">
          <h6 className="mb-0" style={{ fontWeight: 700 }}>Profile Photo</h6>
        </div>
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-4 flex-wrap">
            {/* Avatar display */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  style={{
                    width: 80, height: 80, borderRadius: '50%',
                    objectFit: 'cover', border: '3px solid #e2e8f0',
                  }}
                />
              ) : (
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#16a34a,#15803d)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 800, color: '#fff',
                }}>
                  {initials}
                </div>
              )}
              {uploadAvatar.isPending && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'rgba(0,0,0,.4)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <div className="spinner-border spinner-border-sm text-white" />
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ flex: 1 }}>
              {avatarMsg && (
                <div className={`alert alert-${avatarMsg.type === 'success' ? 'success' : 'danger'} py-2 small mb-2`}>
                  {avatarMsg.text}
                </div>
              )}

              {isPaidPlan ? (
                <div className="d-flex gap-2 flex-wrap">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    style={{ display: 'none' }}
                    onChange={onFileChange}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => { setAvatarMsg(null); fileInputRef.current?.click() }}
                    disabled={uploadAvatar.isPending}
                  >
                    {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  {avatarPreview && (
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => { setAvatarMsg(null); removeAvatar.mutate() }}
                      disabled={removeAvatar.isPending}
                    >
                      Remove
                    </button>
                  )}
                  <div className="w-100 form-text">
                    JPG, PNG, WebP or GIF · Max {20} MB
                  </div>
                </div>
              ) : (
                <div style={{
                  background: '#fefce8', border: '1px solid #fef08a',
                  borderRadius: 8, padding: '10px 14px', fontSize: 13,
                }}>
                  <span style={{ fontWeight: 600, color: '#854d0e' }}>Paid plan required</span>
                  <span style={{ color: '#713f12' }}>
                    {' '}— Profile photos are available on Pro and Enterprise plans.{' '}
                  </span>
                  <a href="/billing" style={{ color: '#16a34a', fontWeight: 600 }}>Upgrade →</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Profile info ── */}
      <div className="card mb-4">
        <div className="card-header bg-white border-bottom py-3 px-4">
          <h6 className="mb-0" style={{ fontWeight: 700 }}>Profile Information</h6>
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
              <div className="form-text">Changing your email will require you to sign in again with the new address.</div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={updateProfile.isPending}>
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
            <button type="submit" className="btn btn-outline-primary" disabled={changePassword.isPending}>
              {changePassword.isPending ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      {/* ── Account details (read-only) ── */}
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
              <div className="fw-semibold small" style={{ textTransform: 'capitalize', color: '#374151' }}>{user?.role}</div>
            </div>
            <div className="col-sm-6">
              <div className="small text-muted mb-1">Plan</div>
              <span style={{
                display: 'inline-block',
                background: user?.plan === 'free' ? '#f1f5f9' : '#f0fdf4',
                color: user?.plan === 'free' ? '#64748b' : '#15803d',
                fontSize: 12, fontWeight: 700, padding: '2px 10px',
                borderRadius: 99, textTransform: 'capitalize',
              }}>
                {user?.plan ?? 'free'}
              </span>
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
