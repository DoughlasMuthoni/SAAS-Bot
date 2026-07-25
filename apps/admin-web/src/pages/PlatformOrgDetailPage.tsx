import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'

interface OrgDetail {
  id: string
  name: string
  slug: string
  plan: string
  plan_expires_at: string | null
  is_suspended: boolean
  suspension_reason: string | null
  user_count: number
  bot_count: number
  workspace_count: number
  conversation_count: number
  message_count: number
  lead_count: number
  owner_email: string | null
  created_at: string
}

interface Invoice {
  id: string
  invoice_number: string
  status: string
  issue_date: string
  due_date: string | null
  currency: string
  total: number
  sent_at: string | null
  paid_at: string | null
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#64748b',
  sent: '#1d4ed8',
  paid: '#15803d',
  overdue: '#dc2626',
}

const PLAN_COLORS: Record<string, string> = {
  free: '#64748b',
  starter: '#2563eb',
  pro: '#7c3aed',
  enterprise: '#d97706',
}

export default function PlatformOrgDetailPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: org, isLoading: orgLoading } = useQuery<OrgDetail>({
    queryKey: ['platform-org', orgId],
    queryFn: () => api.get(`/platform/orgs/${orgId}`).then(r => r.data),
    enabled: !!orgId,
  })

  const { data: invoices = [], isLoading: invLoading } = useQuery<Invoice[]>({
    queryKey: ['platform-invoices', orgId],
    queryFn: () => api.get(`/platform/invoices?org_id=${orgId}`).then(r => r.data),
    enabled: !!orgId,
  })

  const markPaid = useMutation({
    mutationFn: (invoiceId: string) => api.post(`/platform/invoices/${invoiceId}/mark-paid`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-invoices', orgId] }),
  })

  const sendInvoice = useMutation({
    mutationFn: (invoiceId: string) => api.post(`/platform/invoices/${invoiceId}/send`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-invoices', orgId] }),
  })

  const deleteInvoice = useMutation({
    mutationFn: (invoiceId: string) => api.delete(`/platform/invoices/${invoiceId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-invoices', orgId] }),
  })

  if (orgLoading) return <div className="text-center py-5 text-muted">Loading…</div>
  if (!org) return <div className="alert alert-danger">Organisation not found.</div>

  const stat = (label: string, value: string | number) => (
    <div className="col">
      <div className="card text-center p-3">
        <div className="fs-4 fw-bold">{value}</div>
        <div className="small text-muted">{label}</div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="d-flex align-items-center gap-3 mb-4">
        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate('/platform/orgs')}>
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <h4 className="mb-0">{org.name}</h4>
          <span className="text-muted small">{org.slug}</span>
        </div>
        <span
          className="badge rounded-pill"
          style={{
            background: `${PLAN_COLORS[org.plan] || '#64748b'}20`,
            color: PLAN_COLORS[org.plan] || '#64748b',
            fontWeight: 700,
            fontSize: 12,
            padding: '5px 14px',
          }}
        >
          {org.plan.toUpperCase()}
        </span>
        {org.is_suspended ? (
          <span className="badge bg-danger fs-6">Suspended</span>
        ) : (
          <span className="badge bg-success fs-6">Active</span>
        )}
      </div>

      {/* Stats row */}
      <div className="row row-cols-3 row-cols-md-6 g-3 mb-4">
        {stat('Users', org.user_count)}
        {stat('Bots', org.bot_count)}
        {stat('Workspaces', org.workspace_count)}
        {stat('Conversations', org.conversation_count)}
        {stat('Messages', org.message_count)}
        {stat('Leads', org.lead_count)}
      </div>

      {/* Info card */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="small text-muted">Owner Email</div>
              <div className="fw-medium">{org.owner_email || '—'}</div>
            </div>
            <div className="col-md-4">
              <div className="small text-muted">Plan Expires</div>
              <div className="fw-medium">{org.plan_expires_at ? org.plan_expires_at.split('T')[0] : 'Never'}</div>
            </div>
            <div className="col-md-4">
              <div className="small text-muted">Member Since</div>
              <div className="fw-medium">{new Date(org.created_at).toLocaleDateString()}</div>
            </div>
            {org.suspension_reason && (
              <div className="col-12">
                <div className="small text-muted">Suspension Reason</div>
                <div className="text-danger fw-medium">{org.suspension_reason}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoices */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Invoices</h5>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate(`/platform/invoices/new?org_id=${orgId}`)}
        >
          + New Invoice
        </button>
      </div>

      {invLoading ? (
        <div className="text-muted small">Loading invoices…</div>
      ) : invoices.length === 0 ? (
        <div className="card p-4 text-center text-muted">
          <p className="mb-2">No invoices yet for this organisation.</p>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => navigate(`/platform/invoices/new?org_id=${orgId}`)}
          >
            Create first invoice
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Invoice #</th>
                <th>Status</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td className="fw-medium font-monospace">{inv.invoice_number}</td>
                  <td>
                    <span
                      className="badge rounded-pill"
                      style={{
                        background: `${STATUS_COLORS[inv.status] || '#64748b'}18`,
                        color: STATUS_COLORS[inv.status] || '#64748b',
                        fontWeight: 700,
                        fontSize: 11,
                      }}
                    >
                      {inv.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="small">{inv.issue_date}</td>
                  <td className="small">{inv.due_date || '—'}</td>
                  <td className="fw-semibold">{inv.currency} {Number(inv.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => window.open(`/api/v1/platform/invoices/${inv.id}/print`, '_blank')}
                        title="Print / Download PDF"
                      >
                        PDF
                      </button>
                      {inv.status !== 'paid' && (
                        <>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => navigate(`/platform/invoices/${inv.id}/edit`)}
                          >
                            Edit
                          </button>
                          {inv.status !== 'paid' && (
                            <button
                              className="btn btn-sm btn-outline-info"
                              disabled={sendInvoice.isPending}
                              onClick={() => sendInvoice.mutate(inv.id)}
                            >
                              Send
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-success"
                            disabled={markPaid.isPending}
                            onClick={() => {
                              if (window.confirm('Mark this invoice as paid?')) {
                                markPaid.mutate(inv.id)
                              }
                            }}
                          >
                            Mark Paid
                          </button>
                        </>
                      )}
                      {inv.status !== 'paid' && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          disabled={deleteInvoice.isPending}
                          onClick={() => {
                            if (window.confirm(`Delete invoice ${inv.invoice_number}?`)) {
                              deleteInvoice.mutate(inv.id)
                            }
                          }}
                        >
                          Del
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
    </div>
  )
}
