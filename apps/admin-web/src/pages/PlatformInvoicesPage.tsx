import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

interface Invoice {
  id: string
  org_id: string
  org_name: string
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

export default function PlatformInvoicesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [payModal, setPayModal] = useState<{ inv: Invoice } | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payNote, setPayNote] = useState('')
  const [payError, setPayError] = useState('')

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ['platform-invoices-all'],
    queryFn: () => api.get('/platform/invoices').then(r => r.data),
  })

  const sendInvoice = useMutation({
    mutationFn: (id: string) => api.post(`/platform/invoices/${id}/send`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-invoices-all'] }),
  })

  const deleteInvoice = useMutation({
    mutationFn: (id: string) => api.delete(`/platform/invoices/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-invoices-all'] }),
  })

  const recordPayment = useMutation({
    mutationFn: ({ id, amount, note }: { id: string; amount: number; note: string }) =>
      api.post(`/platform/invoices/${id}/record-payment`, { amount, note: note || null }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-invoices-all'] })
      setPayModal(null)
      setPayAmount('')
      setPayNote('')
      setPayError('')
    },
    onError: (e: any) => setPayError(e?.response?.data?.detail || 'Failed to record payment'),
  })

  const openPayModal = (inv: Invoice) => {
    setPayModal({ inv })
    setPayAmount(String(Number(inv.balance_due).toFixed(2)))
    setPayNote('')
    setPayError('')
  }

  const submitPayment = () => {
    if (!payModal) return
    const amount = parseFloat(payAmount)
    if (isNaN(amount) || amount <= 0) { setPayError('Enter a valid amount greater than zero'); return }
    if (amount > Number(payModal.inv.balance_due)) { setPayError(`Amount exceeds balance due (${payModal.inv.currency} ${Number(payModal.inv.balance_due).toLocaleString('en-US', { minimumFractionDigits: 2 })})`); return }
    recordPayment.mutate({ id: payModal.inv.id, amount, note: payNote })
  }

  // Group totals by currency
  const byCurrency = (statuses: string[], field: 'total' | 'amount_paid' | 'balance_due') => {
    const map: Record<string, number> = {}
    invoices.filter(i => statuses.includes(i.status)).forEach(i => {
      map[i.currency] = (map[i.currency] || 0) + Number(i[field])
    })
    return map
  }

  const paidByCurrency        = byCurrency(['paid'], 'total')
  const partialPaidByCurrency = byCurrency(['partial'], 'amount_paid')
  const outstandingByCurrency = byCurrency(['sent', 'partial', 'overdue'], 'balance_due')

  const formatLines = (map: Record<string, number>, colorClass = '') => {
    const entries = Object.entries(map)
    if (entries.length === 0) return <span className="text-muted">—</span>
    return entries.map(([cur, amt]) => (
      <div key={cur} className={colorClass}>
        {cur} {amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </div>
    ))
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">All Invoices</h4>
          <p className="text-muted small mb-0">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/platform/orgs')}>Customers</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/platform/invoices/new')}>+ New Invoice</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card text-center p-3">
            <div className="fs-6 fw-bold text-success lh-sm">{formatLines(paidByCurrency)}</div>
            <div className="small text-muted mt-1">Fully Paid</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card text-center p-3">
            <div className="fs-6 fw-bold lh-sm" style={{ color: '#d97706' }}>{formatLines(partialPaidByCurrency)}</div>
            <div className="small text-muted mt-1">Partially Paid</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card text-center p-3">
            <div className="fs-6 fw-bold text-danger lh-sm">{formatLines(outstandingByCurrency)}</div>
            <div className="small text-muted mt-1">Balance Due</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card text-center p-3">
            <div className="fs-6 fw-bold">{invoices.filter(i => i.status === 'draft').length}</div>
            <div className="small text-muted mt-1">Drafts</div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-5 text-muted">Loading…</div>
      ) : invoices.length === 0 ? (
        <div className="card p-5 text-center text-muted">
          <p className="mb-3">No invoices yet.</p>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/platform/invoices/new')}>Create first invoice</button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Invoice #</th>
                <th className="d-none d-md-table-cell">Organisation</th>
                <th>Status</th>
                <th className="d-none d-sm-table-cell">Issue Date</th>
                <th className="d-none d-lg-table-cell">Due Date</th>
                <th className="text-end">Total</th>
                <th className="text-end d-none d-lg-table-cell">Paid</th>
                <th className="text-end d-none d-lg-table-cell">Balance</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td className="fw-medium font-monospace small">{inv.invoice_number}</td>
                  <td className="d-none d-md-table-cell">
                    <button className="btn btn-link btn-sm p-0 text-start" onClick={() => navigate(`/platform/orgs/${inv.org_id}`)}>
                      {inv.org_name}
                    </button>
                  </td>
                  <td>
                    <span className="badge rounded-pill" style={{
                      background: `${STATUS_COLORS[inv.status] || '#64748b'}18`,
                      color: STATUS_COLORS[inv.status] || '#64748b',
                      fontWeight: 700, fontSize: 11,
                    }}>
                      {inv.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="small d-none d-sm-table-cell">{inv.issue_date}</td>
                  <td className="small d-none d-lg-table-cell">{inv.due_date || '—'}</td>
                  <td className="text-end small fw-semibold">
                    {inv.currency} {Number(inv.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-end small d-none d-lg-table-cell" style={{ color: Number(inv.amount_paid) > 0 ? '#15803d' : '#94a3b8' }}>
                    {Number(inv.amount_paid) > 0
                      ? `${inv.currency} ${Number(inv.amount_paid).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                      : '—'}
                  </td>
                  <td className="text-end small fw-semibold d-none d-lg-table-cell" style={{ color: Number(inv.balance_due) > 0 ? '#dc2626' : '#15803d' }}>
                    {inv.currency} {Number(inv.balance_due).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <div className="d-flex flex-wrap gap-1">
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => openPrintPage(inv.id)} title="Print / PDF">PDF</button>
                      {inv.status !== 'paid' && (
                        <>
                          {inv.status === 'draft' && (
                            <button className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/platform/invoices/${inv.id}/edit`)}>Edit</button>
                          )}
                          <button className="btn btn-sm btn-outline-info" disabled={sendInvoice.isPending} onClick={() => sendInvoice.mutate(inv.id)} title="Email to org">Send</button>
                          <button className="btn btn-sm btn-success" onClick={() => openPayModal(inv)} title="Record a payment">+ Pay</button>
                          <button className="btn btn-sm btn-outline-danger" disabled={deleteInvoice.isPending}
                            onClick={() => { if (window.confirm(`Delete ${inv.invoice_number}?`)) deleteInvoice.mutate(inv.id) }}>
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
                  <div className="form-text">
                    Enter the full balance to mark as paid, or a partial amount.
                  </div>
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
                <button
                  className="btn btn-success"
                  disabled={recordPayment.isPending}
                  onClick={submitPayment}
                >
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
