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
  sent_at: string | null
  paid_at: string | null
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#64748b',
  sent: '#1d4ed8',
  paid: '#15803d',
  overdue: '#dc2626',
}

export default function PlatformInvoicesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ['platform-invoices-all'],
    queryFn: () => api.get('/platform/invoices').then(r => r.data),
  })

  const markPaid = useMutation({
    mutationFn: (id: string) => api.post(`/platform/invoices/${id}/mark-paid`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-invoices-all'] }),
  })

  const sendInvoice = useMutation({
    mutationFn: (id: string) => api.post(`/platform/invoices/${id}/send`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-invoices-all'] }),
  })

  const deleteInvoice = useMutation({
    mutationFn: (id: string) => api.delete(`/platform/invoices/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-invoices-all'] }),
  })

  const totalOutstanding = invoices
    .filter(i => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum, i) => sum + Number(i.total), 0)

  const totalPaid = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + Number(i.total), 0)

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">All Invoices</h4>
          <p className="text-muted small mb-0">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/platform/orgs')}>
            Customers
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/platform/invoices/new')}>
            + New Invoice
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card text-center p-3">
            <div className="fs-5 fw-bold text-success">
              ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="small text-muted">Total Paid</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center p-3">
            <div className="fs-5 fw-bold text-warning">
              ${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="small text-muted">Outstanding</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center p-3">
            <div className="fs-5 fw-bold">{invoices.filter(i => i.status === 'draft').length}</div>
            <div className="small text-muted">Drafts</div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-5 text-muted">Loading…</div>
      ) : invoices.length === 0 ? (
        <div className="card p-5 text-center text-muted">
          <p className="mb-3">No invoices yet.</p>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/platform/invoices/new')}>
            Create first invoice
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Invoice #</th>
                <th>Organisation</th>
                <th>Status</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th className="text-end">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td className="fw-medium font-monospace small">{inv.invoice_number}</td>
                  <td>
                    <button
                      className="btn btn-link btn-sm p-0 text-start"
                      onClick={() => navigate(`/platform/orgs/${inv.org_id}`)}
                    >
                      {inv.org_name}
                    </button>
                  </td>
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
                  <td className="text-end fw-semibold">
                    {inv.currency} {Number(inv.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => window.open(`/api/v1/platform/invoices/${inv.id}/print`, '_blank')}
                        title="Print / PDF"
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
                          <button
                            className="btn btn-sm btn-outline-info"
                            disabled={sendInvoice.isPending}
                            onClick={() => sendInvoice.mutate(inv.id)}
                            title="Email to org contacts"
                          >
                            Send
                          </button>
                          <button
                            className="btn btn-sm btn-success"
                            disabled={markPaid.isPending}
                            onClick={() => {
                              if (window.confirm('Mark as paid?')) markPaid.mutate(inv.id)
                            }}
                          >
                            Paid
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            disabled={deleteInvoice.isPending}
                            onClick={() => {
                              if (window.confirm(`Delete ${inv.invoice_number}?`)) deleteInvoice.mutate(inv.id)
                            }}
                          >
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
    </div>
  )
}
