import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'

async function openPrintPage(invoiceId: string) {
  const resp = await api.get(`/platform/invoices/${invoiceId}/print`, {
    headers: { Accept: 'text/html' },
    responseType: 'text',
  })
  const blob = new Blob([resp.data], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (win) win.addEventListener('load', () => URL.revokeObjectURL(url), { once: true })
}

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
  amount_paid: number
  balance_due: number
  sent_at: string | null
  paid_at: string | null
}

const STATUS_COLORS: Record<string, string> = {
  draft:   '#64748b',
  sent:    '#1d4ed8',
  partial: '#d97706',
  paid:    '#15803d',
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

  const [payModal, setPayModal] = useState<{ inv: Invoice } | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payNote, setPayNote] = useState('')
  const [payError, setPayError] = useState('')

  const recordPayment = useMutation({
    mutationFn: ({ id, amount, note }: { id: string; amount: number; note: string }) =>
      api.post(`/platform/invoices/${id}/record-payment`, { amount, note: note || null }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-invoices', orgId] })
      setPayModal(null); setPayAmount(''); setPayNote(''); setPayError('')
    },
    onError: (e: any) => setPayError(e?.response?.data?.detail || 'Failed to record payment'),
  })

  const openPayModal = (inv: Invoice) => {
    setPayModal({ inv })
    setPayAmount(String(Number(inv.balance_due).toFixed(2)))
    setPayNote(''); setPayError('')
  }

  const submitPayment = () => {
    if (!payModal) return
    const amount = parseFloat(payAmount)
    if (isNaN(amount) || amount <= 0) { setPayError('Enter a valid amount greater than zero'); return }
    if (amount > Number(payModal.inv.balance_due)) { setPayError(`Exceeds balance due (${payModal.inv.currency} ${Number(payModal.inv.balance_due).toFixed(2)})`); return }
    recordPayment.mutate({ id: payModal.inv.id, amount, note: payNote })
  }

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
      <div className="row row-cols-2 row-cols-sm-3 row-cols-md-6 g-3 mb-4">
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
                <th className="d-none d-sm-table-cell">Issue Date</th>
                <th className="d-none d-md-table-cell">Due Date</th>
                <th className="text-end">Total</th>
                <th className="text-end d-none d-md-table-cell">Balance</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td className="fw-medium font-monospace small">{inv.invoice_number}</td>
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
                  <td className="small d-none d-sm-table-cell">{inv.issue_date}</td>
                  <td className="small d-none d-md-table-cell">{inv.due_date || '—'}</td>
                  <td className="text-end small fw-semibold">{inv.currency} {Number(inv.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="text-end small fw-semibold d-none d-md-table-cell"
                    style={{ color: Number(inv.balance_due) > 0 ? '#dc2626' : '#15803d' }}>
                    {inv.currency} {Number(inv.balance_due).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <div className="d-flex flex-wrap gap-1">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => openPrintPage(inv.id)}
                        title="Print / Download PDF"
                      >
                        PDF
                      </button>
                      {inv.status !== 'paid' && (
                        <>
                          {inv.status === 'draft' && (
                            <button className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/platform/invoices/${inv.id}/edit`)}>
                              Edit
                            </button>
                          )}
                          <button className="btn btn-sm btn-outline-info" disabled={sendInvoice.isPending} onClick={() => sendInvoice.mutate(inv.id)}>
                            Send
                          </button>
                          <button className="btn btn-sm btn-success" onClick={() => openPayModal(inv)}>
                            + Pay
                          </button>
                          <button className="btn btn-sm btn-outline-danger" disabled={deleteInvoice.isPending}
                            onClick={() => { if (window.confirm(`Delete invoice ${inv.invoice_number}?`)) deleteInvoice.mutate(inv.id) }}>
                            Del
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Payment Modal */}
      {payModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Record Payment — {payModal.inv.invoice_number}</h5>
                <button className="btn-close" onClick={() => setPayModal(null)} />
              </div>
              <div className="modal-body">
                <div className="mb-3 p-3 rounded" style={{ background: '#f8fafc', fontSize: 13 }}>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Invoice Total</span>
                    <span className="fw-semibold">{payModal.inv.currency} {Number(payModal.inv.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Already Paid</span>
                    <span className="fw-semibold text-success">{payModal.inv.currency} {Number(payModal.inv.amount_paid).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="d-flex justify-content-between" style={{ borderTop: '1px solid #e2e8f0', paddingTop: 6, marginTop: 4 }}>
                    <span className="fw-bold">Balance Due</span>
                    <span className="fw-bold text-danger">{payModal.inv.currency} {Number(payModal.inv.balance_due).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {payError && <div className="alert alert-danger py-2 small">{payError}</div>}

                <div className="mb-3">
                  <label className="form-label">Amount Received ({payModal.inv.currency}) <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    className="form-control"
                    min="0.01"
                    step="0.01"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                  />
                  <div className="form-text">Enter the full balance to mark as paid, or a partial amount.</div>
                </div>

                <div className="mb-2">
                  <label className="form-label">Payment Reference / Note <span className="text-muted small">(optional)</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={payNote}
                    onChange={e => setPayNote(e.target.value)}
                    placeholder="e.g. M-Pesa ref: QK7XYZ, Bank transfer #1234"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={() => setPayModal(null)}>Cancel</button>
                <button className="btn btn-success" disabled={recordPayment.isPending} onClick={submitPayment}>
                  {recordPayment.isPending ? 'Saving…' : 'Record Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
