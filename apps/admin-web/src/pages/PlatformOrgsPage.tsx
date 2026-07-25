import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

interface Org {
  id: string
  name: string
  slug: string
  plan: string
  is_suspended: boolean
  suspension_reason: string | null
  user_count: number
  bot_count: number
  workspace_count: number
  created_at: string
}

const PLAN_COLORS: Record<string, string> = {
  free: '#64748b',
  starter: '#2563eb',
  pro: '#7c3aed',
  enterprise: '#d97706',
}

const PLANS = ['free', 'starter', 'pro', 'enterprise']

export default function PlatformOrgsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [planModal, setPlanModal] = useState<Org | null>(null)
  const [planForm, setPlanForm] = useState({ plan: '', plan_expires_at: '' })
  const [suspendModal, setSuspendModal] = useState<Org | null>(null)
  const [suspendReason, setSuspendReason] = useState('')

  const { data: orgs = [], isLoading } = useQuery<Org[]>({
    queryKey: ['platform-orgs'],
    queryFn: () => api.get('/platform/orgs').then(r => r.data),
  })

  const assignPlan = useMutation({
    mutationFn: ({ orgId, plan, expires }: { orgId: string; plan: string; expires: string }) =>
      api.post(`/platform/orgs/${orgId}/assign-plan`, {
        plan,
        plan_expires_at: expires || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-orgs'] })
      setPlanModal(null)
    },
  })

  const suspend = useMutation({
    mutationFn: ({ orgId, reason }: { orgId: string; reason: string }) =>
      api.post(`/platform/orgs/${orgId}/suspend`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-orgs'] })
      setSuspendModal(null)
      setSuspendReason('')
    },
  })

  const activate = useMutation({
    mutationFn: (orgId: string) => api.post(`/platform/orgs/${orgId}/activate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-orgs'] }),
  })

  const filtered = orgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Customer Accounts</h4>
          <p className="text-muted small mb-0">{orgs.length} organisation{orgs.length !== 1 ? 's' : ''} total</p>
        </div>
        <button className="btn btn-outline-primary btn-sm" onClick={() => navigate('/platform/invoices')}>
          All Invoices
        </button>
      </div>

      <div className="mb-3">
        <input
          className="form-control"
          placeholder="Search by name or slug…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 340 }}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-5 text-muted">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="card p-5 text-center text-muted">No organisations found.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Organisation</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Users</th>
                <th>Bots</th>
                <th>Since</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(org => (
                <tr key={org.id}>
                  <td>
                    <div className="fw-semibold">{org.name}</div>
                    <div className="small text-muted">{org.slug}</div>
                  </td>
                  <td>
                    <span
                      className="badge rounded-pill"
                      style={{
                        background: `${PLAN_COLORS[org.plan] || '#64748b'}20`,
                        color: PLAN_COLORS[org.plan] || '#64748b',
                        fontWeight: 700,
                        fontSize: 11,
                      }}
                    >
                      {org.plan.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {org.is_suspended ? (
                      <span className="badge bg-danger">Suspended</span>
                    ) : (
                      <span className="badge bg-success">Active</span>
                    )}
                  </td>
                  <td>{org.user_count}</td>
                  <td>{org.bot_count}</td>
                  <td className="small text-muted">{new Date(org.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => navigate(`/platform/orgs/${org.id}`)}
                      >
                        Detail
                      </button>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => { setPlanModal(org); setPlanForm({ plan: org.plan, plan_expires_at: '' }) }}
                      >
                        Plan
                      </button>
                      {org.is_suspended ? (
                        <button
                          className="btn btn-sm btn-outline-success"
                          disabled={activate.isPending}
                          onClick={() => activate.mutate(org.id)}
                        >
                          Activate
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => { setSuspendModal(org); setSuspendReason('') }}
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Plan Modal */}
      {planModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Assign Plan — {planModal.name}</h5>
                <button className="btn-close" onClick={() => setPlanModal(null)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Plan</label>
                  <select
                    className="form-select"
                    value={planForm.plan}
                    onChange={e => setPlanForm({ ...planForm, plan: e.target.value })}
                  >
                    {PLANS.map(p => (
                      <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Expires On <span className="text-muted small">(optional)</span></label>
                  <input
                    type="date"
                    className="form-control"
                    value={planForm.plan_expires_at}
                    onChange={e => setPlanForm({ ...planForm, plan_expires_at: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setPlanModal(null)}>Cancel</button>
                <button
                  className="btn btn-primary"
                  disabled={assignPlan.isPending}
                  onClick={() => assignPlan.mutate({ orgId: planModal.id, plan: planForm.plan, expires: planForm.plan_expires_at })}
                >
                  {assignPlan.isPending ? 'Saving…' : 'Save Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {suspendModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Suspend — {suspendModal.name}</h5>
                <button className="btn-close" onClick={() => setSuspendModal(null)} />
              </div>
              <div className="modal-body">
                <div className="alert alert-warning py-2 small">
                  Suspending this account will prevent all users from accessing the platform. Bot widgets will also stop responding.
                </div>
                <div className="mb-3">
                  <label className="form-label">Reason <span className="text-muted small">(optional, sent in admin notifications)</span></label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={suspendReason}
                    onChange={e => setSuspendReason(e.target.value)}
                    placeholder="e.g. Non-payment, Terms violation…"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSuspendModal(null)}>Cancel</button>
                <button
                  className="btn btn-danger"
                  disabled={suspend.isPending}
                  onClick={() => suspend.mutate({ orgId: suspendModal.id, reason: suspendReason })}
                >
                  {suspend.isPending ? 'Suspending…' : 'Suspend Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
