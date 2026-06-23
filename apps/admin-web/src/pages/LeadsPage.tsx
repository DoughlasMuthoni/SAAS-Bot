import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useWorkspaceId } from '../hooks/useWorkspaceId'
import { useRole } from '../hooks/useRole'

interface Lead {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  message: string | null
  status: 'new' | 'contacted' | 'closed'
  page_url: string | null
  conversation_id: string | null
  created_at: string
}

const STATUS_OPTIONS: Lead['status'][] = ['new', 'contacted', 'closed']

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  new:       { bg: '#eff6ff', color: '#1d4ed8', label: 'New' },
  contacted: { bg: '#f0fdf4', color: '#16a34a', label: 'Contacted' },
  closed:    { bg: '#f8fafc', color: '#64748b', label: 'Closed' },
}

function Avatar({ name }: { name: string }) {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%',
      background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.closed
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
      background: s.bg, color: s.color,
    }}>{s.label}</span>
  )
}

function exportCsv(leads: Lead[]) {
  const headers = ['Name', 'Email', 'Phone', 'Message', 'Status', 'Page URL', 'Date']
  const rows = leads.map(l => [
    l.name ?? '', l.email ?? '', l.phone ?? '',
    (l.message ?? '').replace(/"/g, '""'),
    l.status, l.page_url ?? '',
    new Date(l.created_at).toISOString(),
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function LeadsPage() {
  const workspaceId = useWorkspaceId()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { canEdit } = useRole()
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['leads', workspaceId],
    queryFn: () => api.get(`/leads?workspace_id=${workspaceId}&limit=100`).then(r => r.data),
    enabled: !!workspaceId,
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/leads/${id}/status?workspace_id=${workspaceId}`, { status }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads', workspaceId] }),
  })

  const counts = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    closed: leads.filter(l => l.status === 'closed').length,
  }

  const filtered = leads.filter(l => {
    if (statusFilter && l.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        (l.name ?? '').toLowerCase().includes(q) ||
        (l.email ?? '').toLowerCase().includes(q) ||
        (l.phone ?? '').toLowerCase().includes(q) ||
        (l.message ?? '').toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Leads</h1>
          <p style={{ color: '#64748b', fontSize: 13.5, marginTop: 4, marginBottom: 0 }}>
            Visitors who requested follow-up from your chatbot.
          </p>
        </div>
        {leads.length > 0 && (
          <button
            className="btn btn-sm"
            style={{ fontWeight: 600, border: '1px solid #e2e8f0', background: '#fff', color: '#374151' }}
            onClick={() => exportCsv(leads)}
          >
            Export CSV
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total leads', value: counts.total, color: '#4f46e5' },
          { label: 'New',         value: counts.new,   color: '#1d4ed8' },
          { label: 'Contacted',   value: counts.contacted, color: '#16a34a' },
          { label: 'Closed',      value: counts.closed, color: '#64748b' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          className="form-control form-control-sm"
          placeholder="Search name, email, phone, message…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <select
          className="form-select form-select-sm"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ maxWidth: 160 }}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{STATUS_STYLE[s].label}</option>
          ))}
        </select>
        {(search || statusFilter) && (
          <button
            className="btn btn-sm"
            style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#64748b' }}
            onClick={() => { setSearch(''); setStatusFilter('') }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
            {leads.length === 0 ? 'No leads yet' : 'No results'}
          </div>
          <p style={{ color: '#64748b', fontSize: 13.5, margin: 0 }}>
            {leads.length === 0
              ? 'When visitors request a follow-up through your chatbot, they appear here.'
              : 'Try adjusting your search or filter.'}
          </p>
        </div>
      ) : (
        <div className="card p-0" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Contact', 'Message', 'Status', 'Source', 'Date', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.04em', textAlign: 'left' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => {
                const isExpanded = expanded === l.id
                const msgPreview = (l.message ?? '').slice(0, 80)
                const hasMore = (l.message ?? '').length > 80
                return (
                  <tr key={l.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    {/* Contact */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={l.name || l.email || '?'} />
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13.5 }}>
                            {l.name || '—'}
                          </div>
                          {l.email && (
                            <a href={`mailto:${l.email}`} style={{ fontSize: 12, color: '#4f46e5', textDecoration: 'none' }}>
                              {l.email}
                            </a>
                          )}
                          {l.phone && (
                            <div style={{ fontSize: 12, color: '#64748b' }}>{l.phone}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Message */}
                    <td style={{ padding: '14px 16px', maxWidth: 260 }}>
                      {l.message ? (
                        <div style={{ fontSize: 13, color: '#374151' }}>
                          {isExpanded ? l.message : msgPreview}
                          {hasMore && (
                            <button
                              onClick={() => setExpanded(isExpanded ? null : l.id)}
                              style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: 12, padding: '0 4px', cursor: 'pointer' }}
                            >
                              {isExpanded ? ' less' : '… more'}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: 13 }}>—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px' }}>
                      {canEdit ? (
                        <select
                          value={l.status}
                          onChange={e => updateStatus.mutate({ id: l.id, status: e.target.value })}
                          disabled={updateStatus.isPending}
                          style={{
                            fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                            background: STATUS_STYLE[l.status]?.bg ?? '#f8fafc',
                            color: STATUS_STYLE[l.status]?.color ?? '#64748b',
                            border: `1px solid ${STATUS_STYLE[l.status]?.color ?? '#e2e8f0'}33`,
                            cursor: 'pointer', appearance: 'auto',
                          }}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{STATUS_STYLE[s].label}</option>
                          ))}
                        </select>
                      ) : (
                        <StatusBadge status={l.status} />
                      )}
                    </td>

                    {/* Source URL */}
                    <td style={{ padding: '14px 16px', maxWidth: 180 }}>
                      {l.page_url ? (
                        <a
                          href={l.page_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: 12, color: '#64748b', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={l.page_url}
                        >
                          {l.page_url.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {timeAgo(l.created_at)}
                    </td>

                    {/* View conversation */}
                    <td style={{ padding: '14px 16px' }}>
                      {l.conversation_id ? (
                        <button
                          onClick={() => navigate(`/conversations/${l.conversation_id}?workspace_id=${workspaceId}`)}
                          style={{
                            background: '#f1f5f9', border: 'none', borderRadius: 7,
                            padding: '4px 10px', fontSize: 12, fontWeight: 600,
                            color: '#4f46e5', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
                          }}
                          title="Open the chat session that generated this lead"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                          View chat
                        </button>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>
                      )}
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
          Showing {filtered.length} of {leads.length} leads
        </div>
      )}
    </div>
  )
}
