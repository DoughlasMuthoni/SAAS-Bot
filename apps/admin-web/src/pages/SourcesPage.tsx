import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useWorkspaceId } from '../hooks/useWorkspaceId'
import { useRole } from '../hooks/useRole'
import UpgradeModal from '../components/UpgradeModal'

interface Source {
  id: string
  name: string
  source_type: string
  status: string
  chunk_count: number
  bot_id: string
  error_message: string | null
  created_at: string
}

type SourceTab = 'text' | 'faq' | 'upload' | 'crawl'

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  indexed:  { bg: '#f0fdf4', color: '#16a34a', label: 'Indexed' },
  indexing: { bg: '#fef9c3', color: '#92400e', label: 'Indexing…' },
  pending:  { bg: '#f8fafc', color: '#64748b', label: 'Pending' },
  failed:   { bg: '#fef2f2', color: '#dc2626', label: 'Failed' },
  disabled: { bg: '#f8fafc', color: '#94a3b8', label: 'Disabled' },
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  text:   { icon: '📝', color: '#4f46e5', label: 'Text' },
  faq:    { icon: '❓', color: '#0891b2', label: 'FAQ' },
  upload: { icon: '📄', color: '#7c3aed', label: 'File' },
  crawl:  { icon: '🕷️', color: '#16a34a', label: 'Website' },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function SourcesPage() {
  const workspaceId = useWorkspaceId()
  const queryClient = useQueryClient()
  const { canEdit } = useRole()
  const [showModal, setShowModal] = useState(false)
  const [modalTab, setModalTab] = useState<SourceTab>('text')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [botIdForSource, setBotIdForSource] = useState('')
  const [textForm, setTextForm]   = useState({ name: '', content: '' })
  const [faqName, setFaqName]     = useState('')
  const [faqForm, setFaqForm]     = useState<Array<{ question: string; answer: string }>>([{ question: '', answer: '' }])
  const [uploadName, setUploadName] = useState('')
  const [crawlForm, setCrawlForm] = useState({ name: '', url: '', max_pages: 20 })
  const fileRef = useRef<HTMLInputElement>(null)
  const [formError, setFormError] = useState('')
  const [upgradeReason, setUpgradeReason] = useState('')

  const { data: sources = [], isLoading } = useQuery<Source[]>({
    queryKey: ['sources', workspaceId],
    queryFn: () => api.get(`/sources?workspace_id=${workspaceId}`).then(r => r.data),
    enabled: !!workspaceId,
    refetchInterval: (query) => {
      const d = query.state.data as Source[] | undefined
      return d?.some(s => s.status === 'indexing' || s.status === 'pending') ? 4000 : false
    },
  })

  const { data: bots = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ['bots', workspaceId],
    queryFn: () => api.get(`/bots?workspace_id=${workspaceId}`).then(r => r.data),
    enabled: !!workspaceId,
  })

  const botMap = Object.fromEntries(bots.map((b: any) => [b.id, b.name]))

  const addText = useMutation({
    mutationFn: () => api.post('/sources/text', { workspace_id: workspaceId, bot_id: botIdForSource, name: textForm.name, content: textForm.content }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sources'] }); closeModal() },
    onError: (e: any) => handleMutationError(e, 'Failed to add text source.'),
  })

  const addFaq = useMutation({
    mutationFn: () => api.post('/sources/faq', {
      workspace_id: workspaceId, bot_id: botIdForSource,
      name: faqName || 'FAQ',
      faqs: faqForm.filter(p => p.question.trim() && p.answer.trim()),
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sources'] }); closeModal() },
    onError: (e: any) => handleMutationError(e, 'Failed to add FAQ source.'),
  })

  const addUpload = useMutation({
    mutationFn: () => {
      const file = fileRef.current?.files?.[0]
      if (!file) throw new Error('No file selected')
      const fd = new FormData()
      fd.append('file', file)
      fd.append('workspace_id', workspaceId)
      fd.append('bot_id', botIdForSource)
      fd.append('name', uploadName || file.name)
      return api.post('/sources/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sources'] }); closeModal() },
    onError: (e: any) => handleMutationError(e, 'Upload failed. Check file type and size.'),
  })

  const addCrawl = useMutation({
    mutationFn: () => api.post('/sources/crawl', { workspace_id: workspaceId, bot_id: botIdForSource, name: crawlForm.name, url: crawlForm.url, max_pages: crawlForm.max_pages }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sources'] }); closeModal() },
    onError: (e: any) => handleMutationError(e, 'Failed to start crawl.'),
  })

  const reindex = useMutation({
    mutationFn: (id: string) => api.post(`/sources/${id}/reindex?workspace_id=${workspaceId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sources'] }),
  })

  const toggle = useMutation({
    mutationFn: (id: string) => api.post(`/sources/${id}/toggle?workspace_id=${workspaceId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sources'] }),
  })

  function handleMutationError(e: any, fallback: string) {
    if (e?.response?.status === 402) { closeModal(); setUpgradeReason(e?.response?.data?.detail || 'You have reached the source limit on your current plan.') }
    else setFormError(e?.response?.data?.detail || fallback)
  }

  const closeModal = () => {
    setShowModal(false); setFormError('')
    setTextForm({ name: '', content: '' }); setFaqName(''); setFaqForm([{ question: '', answer: '' }])
    setUploadName(''); setCrawlForm({ name: '', url: '', max_pages: 20 })
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setFormError('')
    if (!botIdForSource) { setFormError('Please select a bot.'); return }
    if (modalTab === 'text') {
      if (!textForm.name || !textForm.content) { setFormError('Name and content are required.'); return }
      addText.mutate()
    } else if (modalTab === 'faq') {
      if (!faqForm.filter(p => p.question.trim() && p.answer.trim()).length) { setFormError('Add at least one Q&A pair.'); return }
      addFaq.mutate()
    } else if (modalTab === 'upload') {
      if (!fileRef.current?.files?.[0]) { setFormError('Please select a file.'); return }
      addUpload.mutate()
    } else {
      if (!crawlForm.url) { setFormError('URL is required.'); return }
      if (!crawlForm.name) { setFormError('Source name is required.'); return }
      addCrawl.mutate()
    }
  }

  const isPending = addText.isPending || addFaq.isPending || addUpload.isPending || addCrawl.isPending

  const counts = {
    total:   sources.length,
    indexed: sources.filter(s => s.status === 'indexed').length,
    pending: sources.filter(s => s.status === 'pending' || s.status === 'indexing').length,
    failed:  sources.filter(s => s.status === 'failed').length,
  }

  const filtered = sources.filter(s => {
    if (typeFilter && s.source_type !== typeFilter) return false
    if (statusFilter && s.status !== statusFilter) return false
    return true
  })

  const TAB_LABELS: Record<SourceTab, string> = {
    text: '📝 Text', faq: '❓ FAQ', upload: '📄 File Upload', crawl: '🕷️ Web Crawler',
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Knowledge Sources</h1>
          <p style={{ color: '#64748b', fontSize: 13.5, marginTop: 4, marginBottom: 0 }}>
            Content your bots use to answer questions.
          </p>
        </div>
        {canEdit && (
          <button
            className="btn btn-primary btn-sm"
            style={{ fontWeight: 600 }}
            onClick={() => { setShowModal(true); setBotIdForSource(bots[0]?.id ?? '') }}
          >
            + Add Source
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total sources', value: counts.total,   color: '#4f46e5' },
          { label: 'Indexed',       value: counts.indexed, color: '#16a34a' },
          { label: 'Processing',    value: counts.pending, color: '#92400e' },
          { label: 'Failed',        value: counts.failed,  color: '#dc2626' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <select
          className="form-select form-select-sm"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{ maxWidth: 160 }}
        >
          <option value="">All types</option>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>
        <select
          className="form-select form-select-sm"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ maxWidth: 160 }}
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_STYLE).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        {(typeFilter || statusFilter) && (
          <button
            className="btn btn-sm"
            style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#64748b' }}
            onClick={() => { setTypeFilter(''); setStatusFilter('') }}
          >
            Clear
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Loading…</div>
      ) : sources.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>No knowledge sources yet</div>
          <p style={{ color: '#64748b', fontSize: 13.5, marginBottom: 20, maxWidth: 380, margin: '0 auto 20px' }}>
            Add text, FAQs, upload a PDF, or crawl your website so your bot can answer questions.
          </p>
          {canEdit && <button
            className="btn btn-primary btn-sm"
            style={{ fontWeight: 600 }}
            onClick={() => setShowModal(true)}
          >
            + Add Source
          </button>}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
          No sources match the current filter.
        </div>
      ) : (
        <div className="card p-0" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Source', 'Bot', 'Status', 'Chunks', 'Added', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.04em', textAlign: 'left' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const type = TYPE_CONFIG[s.source_type] ?? { icon: '📄', color: '#64748b', label: s.source_type }
                const status = STATUS_STYLE[s.status] ?? STATUS_STYLE.pending
                const isIndexing = s.status === 'indexing' || s.status === 'pending'
                return (
                  <tr key={s.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    {/* Source name + type */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                          background: type.color + '15',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18,
                        }}>
                          {type.icon}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13.5 }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: type.color, fontWeight: 600, marginTop: 1 }}>{type.label}</div>
                          {s.status === 'failed' && s.error_message && (
                            <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {s.error_message}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Bot name */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 12.5, color: '#374151', background: '#f1f5f9', padding: '3px 8px', borderRadius: 6 }}>
                        {botMap[s.bot_id] ?? '—'}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                        background: status.bg, color: status.color,
                      }}>
                        {isIndexing && (
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: status.color, display: 'inline-block',
                            animation: 'cb-pulse 1s infinite',
                          }} />
                        )}
                        {status.label}
                      </span>
                    </td>

                    {/* Chunk count */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: s.chunk_count > 0 ? '#374151' : '#cbd5e1' }}>
                        {s.chunk_count > 0 ? s.chunk_count : '—'}
                      </span>
                      {s.chunk_count > 0 && (
                        <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>chunks</span>
                      )}
                    </td>

                    {/* Date */}
                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {timeAgo(s.created_at)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => reindex.mutate(s.id)}
                          disabled={reindex.isPending || isIndexing}
                          title="Re-index this source"
                          style={{
                            background: '#f1f5f9', border: 'none', borderRadius: 7,
                            padding: '5px 10px', fontSize: 12, fontWeight: 600,
                            color: '#374151', cursor: isIndexing ? 'default' : 'pointer',
                            opacity: isIndexing ? 0.5 : 1,
                          }}
                        >
                          Re-index
                        </button>
                        <button
                          onClick={() => toggle.mutate(s.id)}
                          disabled={toggle.isPending}
                          style={{
                            background: s.status === 'disabled' ? '#eff6ff' : '#f8fafc',
                            border: 'none', borderRadius: 7,
                            padding: '5px 10px', fontSize: 12, fontWeight: 600,
                            color: s.status === 'disabled' ? '#1d4ed8' : '#64748b',
                            cursor: 'pointer',
                          }}
                        >
                          {s.status === 'disabled' ? 'Enable' : 'Disable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>
          {filtered.length} of {sources.length} sources
        </div>
      )}

      {upgradeReason && <UpgradeModal reason={upgradeReason} onClose={() => setUpgradeReason('')} />}

      {/* Add Source Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.5)', zIndex: 1200 }}
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="modal-dialog modal-lg" style={{ marginTop: '4vh' }}>
            <div className="modal-content" style={{ borderRadius: 14, border: 'none', overflow: 'hidden' }}>

              <div style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h5 style={{ color: '#fff', margin: 0, fontWeight: 700 }}>Add Knowledge Source</h5>
                  <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 13, margin: '2px 0 0' }}>
                    Add content your bot will use to answer questions
                  </p>
                </div>
                <button onClick={closeModal} style={{ background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 8, color: '#fff', width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body" style={{ padding: '1.5rem' }}>
                  {formError && (
                    <div className="alert alert-danger py-2 mb-3" style={{ fontSize: 13 }}>{formError}</div>
                  )}

                  {/* Bot selector */}
                  <div className="mb-4">
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Assign to Bot <span style={{ color: '#ef4444' }}>*</span></label>
                    <select
                      className="form-select"
                      value={botIdForSource}
                      onChange={e => setBotIdForSource(e.target.value)}
                    >
                      <option value="">Select a bot…</option>
                      {bots.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>

                  {/* Source type tabs */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                    {(Object.keys(TAB_LABELS) as SourceTab[]).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => { setModalTab(t); setFormError('') }}
                        style={{
                          padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                          border: modalTab === t ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                          background: modalTab === t ? '#eff6ff' : '#fff',
                          color: modalTab === t ? '#4f46e5' : '#64748b',
                          cursor: 'pointer',
                        }}
                      >
                        {TAB_LABELS[t]}
                      </button>
                    ))}
                  </div>

                  {/* Text tab */}
                  {modalTab === 'text' && (
                    <>
                      <div className="mb-3">
                        <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Source Name</label>
                        <input className="form-control" value={textForm.name} onChange={e => setTextForm({ ...textForm, name: e.target.value })} placeholder="e.g. About Us, Pricing, Returns Policy" />
                      </div>
                      <div className="mb-3">
                        <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Content</label>
                        <textarea className="form-control" rows={9} value={textForm.content} onChange={e => setTextForm({ ...textForm, content: e.target.value })} placeholder="Paste your content here. The bot will only answer questions covered by this text." />
                        <div className="form-text">{textForm.content.length.toLocaleString()} characters</div>
                      </div>
                    </>
                  )}

                  {/* FAQ tab */}
                  {modalTab === 'faq' && (
                    <>
                      <div className="mb-3">
                        <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Source Name</label>
                        <input className="form-control" value={faqName} onChange={e => setFaqName(e.target.value)} placeholder="e.g. Product FAQs, Shipping Questions" />
                      </div>
                      {faqForm.map((pair, i) => (
                        <div key={i} style={{ background: '#f8fafc', borderRadius: 10, padding: '1rem', marginBottom: 10, border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Q&A #{i + 1}</span>
                            {faqForm.length > 1 && (
                              <button type="button" onClick={() => setFaqForm(faqForm.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Remove</button>
                            )}
                          </div>
                          <input className="form-control mb-2" style={{ fontSize: 13 }} value={pair.question} onChange={e => { const u = [...faqForm]; u[i] = { ...pair, question: e.target.value }; setFaqForm(u) }} placeholder="Question" />
                          <textarea className="form-control" style={{ fontSize: 13 }} rows={2} value={pair.answer} onChange={e => { const u = [...faqForm]; u[i] = { ...pair, answer: e.target.value }; setFaqForm(u) }} placeholder="Answer" />
                        </div>
                      ))}
                      <button type="button" className="btn btn-sm" style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600 }} onClick={() => setFaqForm([...faqForm, { question: '', answer: '' }])}>
                        + Add Q&A Pair
                      </button>
                    </>
                  )}

                  {/* File Upload tab */}
                  {modalTab === 'upload' && (
                    <>
                      <div className="mb-3">
                        <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Display Name</label>
                        <input className="form-control" value={uploadName} onChange={e => setUploadName(e.target.value)} placeholder="Optional — defaults to file name" />
                      </div>
                      <div className="mb-3">
                        <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>File</label>
                        <input ref={fileRef} type="file" className="form-control" accept=".pdf,.txt,.docx,.csv" />
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {[{ ext: 'PDF', icon: '📕', desc: 'Brochures, reports' }, { ext: 'DOCX', icon: '📘', desc: 'Word documents' }, { ext: 'TXT', icon: '📄', desc: 'Plain text' }, { ext: 'CSV', icon: '📊', desc: 'Spreadsheets' }].map(f => (
                          <div key={f.ext} style={{ background: '#f8fafc', borderRadius: 8, padding: '6px 12px', border: '1px solid #e2e8f0', fontSize: 12 }}>
                            {f.icon} <strong>{f.ext}</strong> — {f.desc}
                          </div>
                        ))}
                      </div>
                      <div className="form-text mt-2">Maximum file size: 20 MB</div>
                    </>
                  )}

                  {/* Web Crawler tab */}
                  {modalTab === 'crawl' && (
                    <>
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px', marginBottom: '1.25rem', fontSize: 13, color: '#15803d', display: 'flex', gap: 10 }}>
                        <span style={{ fontSize: 18, flexShrink: 0 }}>🕷️</span>
                        <div>The crawler visits your URL, follows links on the same domain, and extracts text from each page automatically.</div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Source Name</label>
                        <input className="form-control" value={crawlForm.name} onChange={e => setCrawlForm({ ...crawlForm, name: e.target.value })} placeholder="e.g. Company Website, Help Centre" />
                      </div>
                      <div className="mb-3">
                        <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Start URL</label>
                        <input className="form-control" type="url" value={crawlForm.url} onChange={e => { const url = e.target.value; setCrawlForm({ ...crawlForm, url, name: crawlForm.name || _domainFromUrl(url) }) }} placeholder="https://yourwebsite.com" />
                        <div className="form-text">The crawler will start here and follow links on the same domain.</div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>Max pages — <strong>{crawlForm.max_pages}</strong></label>
                        <input type="range" className="form-range" min={1} max={100} step={1} value={crawlForm.max_pages} onChange={e => setCrawlForm({ ...crawlForm, max_pages: Number(e.target.value) })} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' }}>
                          <span>1 (fast)</span><span>50 (recommended)</span><span>100 (thorough)</span>
                        </div>
                      </div>
                      <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 12px', fontSize: 12.5, color: '#92400e' }}>
                        ⏱ Crawling runs in the background. Status updates from <em>Pending → Indexing → Indexed</em>.
                      </div>
                    </>
                  )}
                </div>

                <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', padding: '1rem 1.5rem', gap: 10 }}>
                  <button type="button" className="btn btn-light btn-sm" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ fontWeight: 600 }} disabled={isPending}>
                    {isPending ? <><span className="spinner-border spinner-border-sm me-2" />{modalTab === 'crawl' ? 'Starting…' : 'Adding…'}</> : modalTab === 'crawl' ? '🕷️ Start Crawl' : 'Add Source'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function _domainFromUrl(url: string): string {
  try { return new URL(url).hostname } catch { return '' }
}
