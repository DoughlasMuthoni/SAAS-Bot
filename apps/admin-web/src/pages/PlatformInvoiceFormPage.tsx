import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../lib/api'

interface LineItem {
  description: string
  quantity: string
  unit_price: string
  sort_order: number
}

interface Org {
  id: string
  name: string
  slug: string
}

const emptyLine = (): LineItem => ({ description: '', quantity: '1', unit_price: '', sort_order: 0 })

const today = () => new Date().toISOString().split('T')[0]
const in30days = () => {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
}

export default function PlatformInvoiceFormPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isEdit = !!invoiceId

  const prefillOrgId = searchParams.get('org_id') || ''

  const [orgId, setOrgId] = useState(prefillOrgId)
  const [issueDate, setIssueDate] = useState(today())
  const [dueDate, setDueDate] = useState(in30days())
  const [currency, setCurrency] = useState('USD')
  const [taxRate, setTaxRate] = useState('0')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<LineItem[]>([emptyLine()])
  const [error, setError] = useState('')

  const { data: orgs = [] } = useQuery<Org[]>({
    queryKey: ['platform-orgs-list'],
    queryFn: () => api.get('/platform/orgs').then(r => r.data),
  })

  // Load existing invoice for edit
  useQuery({
    queryKey: ['platform-invoice-edit', invoiceId],
    queryFn: () => api.get(`/platform/invoices/${invoiceId}`).then(r => r.data),
    enabled: isEdit,
    gcTime: 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (data: any) => data,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    staleTime: 0,
    // Load into state
    refetchOnMount: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSuccess: (data: any) => {
      setOrgId(data.org_id)
      setIssueDate(data.issue_date)
      setDueDate(data.due_date || '')
      setCurrency(data.currency)
      setTaxRate(String(data.tax_rate))
      setNotes(data.notes || '')
      setLines(
        data.items.map((item: any) => ({
          description: item.description,
          quantity: String(item.quantity),
          unit_price: String(item.unit_price),
          sort_order: item.sort_order,
        }))
      )
    },
  } as any)

  const saveMutation = useMutation({
    mutationFn: (payload: object) =>
      isEdit
        ? api.put(`/platform/invoices/${invoiceId}`, payload).then(r => r.data)
        : api.post('/platform/invoices', payload).then(r => r.data),
    onSuccess: (data: any) => {
      const targetOrg = data.org_id || orgId
      navigate(`/platform/orgs/${targetOrg}`)
    },
    onError: (e: any) => setError(e?.response?.data?.detail || 'Failed to save invoice'),
  })

  const compute = () => {
    const subtotal = lines.reduce((sum, l) => {
      const qty = parseFloat(l.quantity) || 0
      const price = parseFloat(l.unit_price) || 0
      return sum + qty * price
    }, 0)
    const tax = subtotal * (parseFloat(taxRate) || 0) / 100
    return { subtotal, tax, total: subtotal + tax }
  }

  const { subtotal, tax, total } = compute()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!orgId) { setError('Select an organisation'); return }
    if (lines.some(l => !l.description.trim() || !l.unit_price)) {
      setError('All line items must have a description and price')
      return
    }
    saveMutation.mutate({
      org_id: orgId,
      issue_date: issueDate,
      due_date: dueDate || null,
      currency,
      tax_rate: parseFloat(taxRate) || 0,
      notes: notes || null,
      items: lines.map((l, i) => ({
        description: l.description,
        quantity: parseFloat(l.quantity) || 1,
        unit_price: parseFloat(l.unit_price) || 0,
        sort_order: i,
      })),
    })
  }

  const updateLine = (i: number, field: keyof LineItem, value: string) => {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))
  }

  const addLine = () => setLines(prev => [...prev, emptyLine()])
  const removeLine = (i: number) => setLines(prev => prev.filter((_, idx) => idx !== i))

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="d-flex align-items-center gap-3 mb-4">
        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(-1)}>← Back</button>
        <h4 className="mb-0">{isEdit ? 'Edit Invoice' : 'New Invoice'}</h4>
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Header fields */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Organisation <span className="text-danger">*</span></label>
                <select
                  className="form-select"
                  value={orgId}
                  onChange={e => setOrgId(e.target.value)}
                  disabled={isEdit}
                >
                  <option value="">Select organisation…</option>
                  {orgs.map(o => (
                    <option key={o.id} value={o.id}>{o.name} ({o.slug})</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Currency</label>
                <select className="form-select" value={currency} onChange={e => setCurrency(e.target.value)}>
                  <option value="USD">USD</option>
                  <option value="KES">KES</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Tax Rate (%)</label>
                <input
                  type="number"
                  className="form-control"
                  value={taxRate}
                  min="0"
                  max="100"
                  step="0.01"
                  onChange={e => setTaxRate(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Issue Date</label>
                <input type="date" className="form-control" value={issueDate} onChange={e => setIssueDate(e.target.value)} required />
              </div>
              <div className="col-md-3">
                <label className="form-label">Due Date <span className="text-muted small">(optional)</span></label>
                <input type="date" className="form-control" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <span className="fw-semibold">Line Items</span>
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={addLine}>+ Add Line</button>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ minWidth: 240 }}>Description</th>
                    <th style={{ width: 90 }}>Qty</th>
                    <th style={{ width: 130 }}>Unit Price</th>
                    <th style={{ width: 120 }} className="text-end">Subtotal</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, i) => {
                    const sub = (parseFloat(line.quantity) || 0) * (parseFloat(line.unit_price) || 0)
                    return (
                      <tr key={i}>
                        <td>
                          <input
                            className="form-control form-control-sm"
                            value={line.description}
                            onChange={e => updateLine(i, 'description', e.target.value)}
                            placeholder="e.g. Pro Plan — August 2026"
                            required
                          />
                        </td>
                        <td>
                          <input
                            className="form-control form-control-sm"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={line.quantity}
                            onChange={e => updateLine(i, 'quantity', e.target.value)}
                            required
                          />
                        </td>
                        <td>
                          <input
                            className="form-control form-control-sm"
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.unit_price}
                            onChange={e => updateLine(i, 'unit_price', e.target.value)}
                            placeholder="0.00"
                            required
                          />
                        </td>
                        <td className="text-end fw-semibold small">
                          {currency} {sub.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td>
                          {lines.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeLine(i)}
                            >×</button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="d-flex justify-content-end mt-3">
              <table style={{ width: 260 }}>
                <tbody>
                  <tr>
                    <td className="text-muted small py-1">Subtotal</td>
                    <td className="text-end small py-1">{currency} {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  {parseFloat(taxRate) > 0 && (
                    <tr>
                      <td className="text-muted small py-1">Tax ({taxRate}%)</td>
                      <td className="text-end small py-1">{currency} {tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  )}
                  <tr style={{ borderTop: '2px solid #0f172a' }}>
                    <td className="fw-bold pt-2">Total</td>
                    <td className="text-end fw-bold pt-2">{currency} {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card mb-4">
          <div className="card-body">
            <label className="form-label">Notes <span className="text-muted small">(optional — payment instructions, bank details, etc.)</span></label>
            <textarea
              className="form-control"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Please transfer to Equity Bank Account …, Reference: INV-2026-0001"
            />
          </div>
        </div>

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Invoice'}
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
