import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useWorkspaceId } from '../hooks/useWorkspaceId'

interface Conversation {
  id: string
  session_id: string
  status: string
  message_count: number
  visitor_domain: string | null
  started_at: string
  last_message_at: string | null
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  active:     { bg: '#eff6ff', color: '#1d4ed8' },
  resolved:   { bg: '#f0fdf4', color: '#16a34a' },
  unresolved: { bg: '#fef3c7', color: '#92400e' },
  lead:       { bg: '#faf5ff', color: '#7c3aed' },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { bg: '#f8fafc', color: '#64748b' }
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
      background: s.bg, color: s.color, textTransform: 'capitalize',
    }}>{status}</span>
  )
}

export default function ConversationsPage() {
  const workspaceId = useWorkspaceId()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('')

  const { data: convs = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ['conversations', workspaceId, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams({ workspace_id: workspaceId, limit: '100' })
      if (statusFilter) params.set('status', statusFilter)
      return api.get(`/conversations?${params}`).then(r => r.data)
    },
    enabled: !!workspaceId,
    refetchInterval: 10000,
  })

  const counts = {
    total:      convs.length,
    active:     convs.filter(c => c.status === 'active').length,
    resolved:   convs.filter(c => c.status === 'resolved').length,
    unresolved: convs.filter(c => c.status === 'unresolved').length,
    lead:       convs.filter(c => c.status === 'lead').length,
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Conversations</h1>
        <p style={{ color: '#64748b', fontSize: 13.5, marginTop: 4, marginBottom: 0 }}>
          Every chat session from your embedded bots.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total',      value: counts.total,      color: '#4f46e5', filter: '' },
          { label: 'Active',     value: counts.active,     color: '#1d4ed8', filter: 'active' },
          { label: 'Resolved',   value: counts.resolved,   color: '#16a34a', filter: 'resolved' },
          { label: 'Unresolved', value: counts.unresolved, color: '#92400e', filter: 'unresolved' },
          { label: 'Leads',      value: counts.lead,       color: '#7c3aed', filter: 'lead' },
        ].map(s => (
          <div
            key={s.label}
            className="card"
            style={{
              padding: '14px 18px', cursor: 'pointer',
              outline: statusFilter === s.filter && s.filter !== '' ? `2px solid ${s.color}` : 'none',
            }}
            onClick={() => setStatusFilter(prev => prev === s.filter ? '' : s.filter)}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <select
          className="form-select form-select-sm"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ maxWidth: 180 }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="resolved">Resolved</option>
          <option value="unresolved">Unresolved</option>
          <option value="lead">Lead</option>
        </select>
        {statusFilter && (
          <button
            className="btn btn-sm"
            style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#64748b' }}
            onClick={() => setStatusFilter('')}
          >
            Clear filter
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Loading…</div>
      ) : convs.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>No conversations yet</div>
          <p style={{ color: '#64748b', fontSize: 13.5, margin: 0 }}>
            Conversations will appear here once visitors use your embedded chatbot.
          </p>
        </div>
      ) : (
        <div className="card p-0" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Session', 'Domain', 'Messages', 'Status', 'Started', 'Last activity'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.04em', textAlign: 'left' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {convs.map((c, i) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/conversations/${c.id}?workspace_id=${workspaceId}`)}
                  style={{
                    borderBottom: i < convs.length - 1 ? '1px solid #f1f5f9' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  {/* Session */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: c.status === 'active' ? '#22c55e' : c.status === 'unresolved' ? '#f59e0b' : c.status === 'lead' ? '#7c3aed' : '#cbd5e1',
                      }} />
                      <code style={{ fontSize: 12, color: '#374151', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                        {c.session_id.slice(0, 8)}…
                      </code>
                    </div>
                  </td>

                  {/* Domain */}
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b' }}>
                    {c.visitor_domain || <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>

                  {/* Message count */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{c.message_count}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '14px 16px' }}>
                    <StatusBadge status={c.status} />
                  </td>

                  {/* Started */}
                  <td style={{ padding: '14px 16px', fontSize: 12.5, color: '#64748b', whiteSpace: 'nowrap' }}>
                    {new Date(c.started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>

                  {/* Last activity */}
                  <td style={{ padding: '14px 16px', fontSize: 12.5, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {c.last_message_at ? timeAgo(c.last_message_at) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {convs.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>
          {convs.length} conversation{convs.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
