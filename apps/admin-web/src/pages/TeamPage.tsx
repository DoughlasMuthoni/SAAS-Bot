import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuthStore } from '../lib/auth'

interface Member {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  last_login_at: string | null
  created_at: string
}

const ROLE_ORDER = ['owner', 'admin', 'editor', 'viewer']

const ROLE_BADGE: Record<string, { bg: string; color: string }> = {
  owner:  { bg: '#fef3c7', color: '#92400e' },
  admin:  { bg: '#eff6ff', color: '#1d4ed8' },
  editor: { bg: '#f0fdf4', color: '#16a34a' },
  viewer: { bg: '#f8fafc', color: '#64748b' },
}

function RoleBadge({ role }: { role: string }) {
  const style = ROLE_BADGE[role] ?? ROLE_BADGE.viewer
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
      background: style.bg, color: style.color, textTransform: 'capitalize',
    }}>
      {role}
    </span>
  )
}

function Avatar({ name }: { name: string }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      background: 'linear-gradient(135deg,#16a34a,#1d4ed8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

const ASSIGNABLE_ROLES = ['admin', 'editor', 'viewer'] as const

export default function TeamPage() {
  const { user: me } = useAuthStore()
  const qc = useQueryClient()
  const isOwnerOrAdmin = me?.role === 'owner' || me?.role === 'admin'

  const [showInvite, setShowInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState({ full_name: '', email: '', role: 'editor', password: '' })
  const [inviteError, setInviteError] = useState('')
  const [confirmRemove, setConfirmRemove] = useState<Member | null>(null)

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ['team'],
    queryFn: () => api.get('/team').then(r => r.data),
  })

  const invite = useMutation({
    mutationFn: (data: typeof inviteForm) => api.post('/team/invite', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] })
      setShowInvite(false)
      setInviteForm({ full_name: '', email: '', role: 'editor', password: '' })
      setInviteError('')
    },
    onError: (err: any) => {
      setInviteError(err.response?.data?.detail || 'Failed to invite member.')
    },
  })

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.put(`/team/${id}/role`, { role }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/team/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] })
      setConfirmRemove(null)
    },
  })

  const sorted = [...members].sort((a, b) =>
    ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)
  )

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Team Members</h1>
          <p style={{ color: '#64748b', fontSize: 13.5, marginTop: 4, marginBottom: 0 }}>
            Manage who has access to this workspace.
          </p>
        </div>
        {isOwnerOrAdmin && (
          <button
            onClick={() => { setShowInvite(true); setInviteError('') }}
            className="btn btn-primary btn-sm"
            style={{ fontWeight: 600 }}
          >
            + Invite member
          </button>
        )}
      </div>

      {/* Member list */}
      <div className="card p-0" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading…</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.04em' }}>Member</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.04em' }}>Role</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.04em' }}>Last login</th>
                {isOwnerOrAdmin && <th style={{ padding: '10px 16px', width: 80 }} />}
              </tr>
            </thead>
            <tbody>
              {sorted.map((m, i) => {
                const isMe = m.id === me?.id
                const canManage = isOwnerOrAdmin && !isMe && m.role !== 'owner'
                const canPromoteToAdmin = me?.role === 'owner'
                return (
                  <tr key={m.id} style={{ borderBottom: i < sorted.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar name={m.full_name || m.email} />
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>
                            {m.full_name}
                            {isMe && <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>(you)</span>}
                          </div>
                          <div style={{ fontSize: 12.5, color: '#64748b' }}>{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {canManage ? (
                        <select
                          value={m.role}
                          onChange={e => updateRole.mutate({ id: m.id, role: e.target.value })}
                          style={{
                            fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                            background: ROLE_BADGE[m.role]?.bg ?? '#f8fafc',
                            color: ROLE_BADGE[m.role]?.color ?? '#64748b',
                            border: '1px solid #e2e8f0', cursor: 'pointer', appearance: 'auto',
                          }}
                          disabled={updateRole.isPending}
                        >
                          {ASSIGNABLE_ROLES
                            .filter(r => r !== 'admin' || canPromoteToAdmin)
                            .map(r => <option key={r} value={r} style={{ textTransform: 'capitalize' }}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)
                          }
                        </select>
                      ) : (
                        <RoleBadge role={m.role} />
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12.5, color: '#94a3b8' }}>
                      {m.last_login_at
                        ? new Date(m.last_login_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Never'}
                    </td>
                    {isOwnerOrAdmin && (
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {canManage && (
                          <button
                            onClick={() => setConfirmRemove(m)}
                            style={{
                              background: 'none', border: 'none', color: '#ef4444', fontSize: 13,
                              cursor: 'pointer', padding: '4px 8px', borderRadius: 6,
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Role legend */}
      <div style={{ marginTop: 20, padding: '14px 18px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
        <div style={{ fontWeight: 700, fontSize: 12.5, color: '#374151', marginBottom: 10 }}>Role permissions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
          {[
            { role: 'owner', desc: 'Full control, billing, team management' },
            { role: 'admin', desc: 'Manage bots, sources, and members' },
            { role: 'editor', desc: 'Add/edit knowledge sources and bots' },
            { role: 'viewer', desc: 'Read-only access to conversations and analytics' },
          ].map(({ role, desc }) => (
            <div key={role} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <RoleBadge role={role} />
              <span style={{ fontSize: 12, color: '#64748b' }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div
          className="modal show d-block"
          style={{ background: 'rgba(0,0,0,.5)', zIndex: 1200 }}
          onClick={e => { if (e.target === e.currentTarget) setShowInvite(false) }}
        >
          <div className="modal-dialog" style={{ maxWidth: 460, marginTop: '10vh' }}>
            <div className="modal-content" style={{ borderRadius: 14, border: 'none' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid #f1f5f9', padding: '1.25rem 1.5rem' }}>
                <h5 className="modal-title" style={{ fontWeight: 800, fontSize: '1rem' }}>Invite a team member</h5>
                <button className="btn-close" onClick={() => setShowInvite(false)} />
              </div>
              <form onSubmit={e => { e.preventDefault(); invite.mutate(inviteForm) }}>
                <div className="modal-body" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {inviteError && (
                    <div className="alert alert-danger py-2 mb-0" style={{ fontSize: 13.5 }}>{inviteError}</div>
                  )}
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Full name</label>
                    <input
                      className="form-control"
                      placeholder="Jane Doe"
                      value={inviteForm.full_name}
                      onChange={e => setInviteForm(f => ({ ...f, full_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Email address</label>
                    <input
                      className="form-control"
                      type="email"
                      placeholder="jane@company.com"
                      value={inviteForm.email}
                      onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Role</label>
                    <select
                      className="form-select"
                      value={inviteForm.role}
                      onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}
                    >
                      {ASSIGNABLE_ROLES
                        .filter(r => r !== 'admin' || me?.role === 'owner')
                        .map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)
                      }
                    </select>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 5 }}>
                      {inviteForm.role === 'admin' && 'Can manage bots, sources, and team members.'}
                      {inviteForm.role === 'editor' && 'Can add and edit knowledge sources and bots.'}
                      {inviteForm.role === 'viewer' && 'Read-only: can view conversations and analytics.'}
                    </div>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Temporary password</label>
                    <input
                      className="form-control"
                      type="password"
                      placeholder="Min. 6 characters"
                      value={inviteForm.password}
                      onChange={e => setInviteForm(f => ({ ...f, password: e.target.value }))}
                      required
                      minLength={6}
                    />
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 5 }}>
                      Share this password with the member so they can log in. They can change it later.
                    </div>
                  </div>
                </div>
                <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', padding: '1rem 1.5rem', gap: 10 }}>
                  <button type="button" className="btn btn-light btn-sm" onClick={() => setShowInvite(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={invite.isPending}>
                    {invite.isPending ? 'Inviting…' : 'Add member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Remove confirmation modal */}
      {confirmRemove && (
        <div
          className="modal show d-block"
          style={{ background: 'rgba(0,0,0,.5)', zIndex: 1200 }}
          onClick={e => { if (e.target === e.currentTarget) setConfirmRemove(null) }}
        >
          <div className="modal-dialog" style={{ maxWidth: 400, marginTop: '15vh' }}>
            <div className="modal-content" style={{ borderRadius: 14, border: 'none' }}>
              <div className="modal-body" style={{ padding: '1.75rem' }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 8 }}>Remove member?</div>
                <p style={{ color: '#64748b', fontSize: 13.5 }}>
                  <strong>{confirmRemove.full_name}</strong> ({confirmRemove.email}) will lose access immediately.
                  This cannot be undone without re-inviting them.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                  <button className="btn btn-light btn-sm" onClick={() => setConfirmRemove(null)}>Cancel</button>
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(confirmRemove.id)}
                  >
                    {remove.isPending ? 'Removing…' : 'Remove member'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
