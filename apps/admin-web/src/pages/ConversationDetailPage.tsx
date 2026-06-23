import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useWorkspaceId } from '../hooks/useWorkspaceId'
import { useRole } from '../hooks/useRole'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  retrieved_chunk_ids: string[] | null
  was_grounded: boolean | null
  model_used: string | null
  latency_ms: number | null
  created_at: string
}

interface ConversationDetail {
  id: string
  session_id: string
  status: string
  message_count: number
  visitor_domain: string | null
  started_at: string
  last_message_at: string | null
  messages: Message[]
}

const STATUS_OPTIONS = ['active', 'resolved', 'unresolved', 'lead'] as const

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  active:     { bg: '#eff6ff', color: '#1d4ed8' },
  resolved:   { bg: '#f0fdf4', color: '#16a34a' },
  unresolved: { bg: '#fef3c7', color: '#92400e' },
  lead:       { bg: '#faf5ff', color: '#7c3aed' },
}

function BotAvatar() {
  return (
    <div style={{
      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="9" width="14" height="12" rx="2"/>
        <path d="M9 9V7a3 3 0 016 0v2"/>
        <circle cx="9" cy="14" r="1" fill="#fff" stroke="none"/>
        <circle cx="15" cy="14" r="1" fill="#fff" stroke="none"/>
      </svg>
    </div>
  )
}

export default function ConversationDetailPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const [params] = useSearchParams()
  const storeWorkspaceId = useWorkspaceId()
  // prefer Zustand store; fall back to URL param for direct deep-links
  const workspaceId = storeWorkspaceId || params.get('workspace_id') || ''
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { canEdit } = useRole()

  const { data: conv, isLoading } = useQuery<ConversationDetail>({
    queryKey: ['conversation', conversationId],
    queryFn: () =>
      api.get(`/conversations/${conversationId}?workspace_id=${workspaceId}`).then(r => r.data),
    enabled: !!conversationId && !!workspaceId,
    refetchInterval: (data) => data?.status === 'active' ? 5000 : false,
  })

  const [statusError, setStatusError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conv?.messages?.length])

  const updateStatus = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/conversations/${conversationId}/status?workspace_id=${workspaceId}`, { status }).then(r => r.data),
    onSuccess: (data) => {
      setStatusError('')
      // Patch the detail cache immediately
      qc.setQueryData(['conversation', conversationId], (old: any) =>
        old ? { ...old, status: data.status } : old
      )
      // Also patch every conversations-list cache entry so the list reflects
      // the new status instantly when the user navigates back
      qc.setQueriesData(
        { queryKey: ['conversations'] },
        (old: any) =>
          Array.isArray(old)
            ? old.map((c: any) => c.id === conversationId ? { ...c, status: data.status } : c)
            : old
      )
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail
      // FastAPI 422 returns detail as an array of Pydantic error objects
      if (typeof detail === 'string') {
        setStatusError(detail)
      } else if (Array.isArray(detail) && detail.length > 0) {
        setStatusError(detail[0]?.msg || 'Invalid value.')
      } else {
        setStatusError('Failed to update status.')
      }
    },
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: '#94a3b8' }}>
        Loading…
      </div>
    )
  }
  if (!conv) {
    return <div className="alert alert-danger">Conversation not found.</div>
  }

  // Guard against stale DB values that don't exist in the current enum
  const currentStatus = STATUS_OPTIONS.includes(conv.status as any) ? conv.status : 'active'
  const statusStyle = STATUS_STYLE[currentStatus] ?? { bg: '#f8fafc', color: '#64748b' }

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28 }}>
        <button
          onClick={() => navigate('/conversations')}
          style={{
            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8,
            padding: '6px 12px', fontSize: 13, fontWeight: 600, color: '#374151',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
          }}
        >
          ← Back
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Session
            </h1>
            <code style={{ fontSize: 12, background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, color: '#374151' }}>
              {conv.session_id.slice(0, 16)}…
            </code>
            {/* Status — editable for owner/admin/editor, badge-only for viewer */}
            {canEdit ? (
              <select
                value={currentStatus}
                onChange={e => updateStatus.mutate(e.target.value)}
                disabled={updateStatus.isPending}
                style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  background: statusStyle.bg, color: statusStyle.color,
                  border: `1px solid ${statusStyle.color}33`,
                  cursor: 'pointer', appearance: 'auto',
                }}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s} style={{ textTransform: 'capitalize' }}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            ) : (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: statusStyle.bg, color: statusStyle.color,
                border: `1px solid ${statusStyle.color}33`,
                textTransform: 'capitalize',
              }}>
                {currentStatus}
              </span>
            )}
            {updateStatus.isPending && (
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Saving…</span>
            )}
            {statusError && (
              <span style={{ fontSize: 11, color: '#dc2626' }}>{statusError}</span>
            )}
          </div>
          <div style={{ marginTop: 6, fontSize: 12.5, color: '#94a3b8', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {conv.visitor_domain && <span>🌐 {conv.visitor_domain}</span>}
            <span>🗓 {new Date(conv.started_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            <span>💬 {conv.message_count} message{conv.message_count !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16 }}>
        {conv.messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>No messages in this conversation.</div>
        ) : (
          [...conv.messages]
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map(msg => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
                gap: 10,
              }}
            >
              {/* Bot avatar */}
              {msg.role === 'assistant' && <BotAvatar />}

              <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {/* Bubble */}
                <div style={{
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.role === 'user' ? '#4f46e5' : '#fff',
                  color: msg.role === 'user' ? '#fff' : '#1e293b',
                  fontSize: 14,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  border: msg.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
                  boxShadow: '0 1px 3px rgba(0,0,0,.06)',
                }}>
                  {msg.content || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>(empty)</span>}
                </div>

                {/* Meta row */}
                <div style={{ display: 'flex', gap: 10, marginTop: 5, fontSize: 11, color: '#94a3b8', alignItems: 'center' }}>
                  <span>{new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>

                  {msg.role === 'assistant' && (
                    <>
                      {msg.was_grounded !== null && (
                        <span style={{ color: msg.was_grounded ? '#16a34a' : '#f59e0b', fontWeight: 600 }}>
                          {msg.was_grounded ? '✓ grounded' : '⚠ ungrounded'}
                        </span>
                      )}
                      {msg.latency_ms !== null && (
                        <span>{msg.latency_ms}ms</span>
                      )}
                      {msg.model_used && (
                        <span style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, fontSize: 10 }}>
                          {msg.model_used}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Retrieved sources */}
                {msg.role === 'assistant' && msg.retrieved_chunk_ids && msg.retrieved_chunk_ids.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                      background: '#f0fdf4', color: '#16a34a', display: 'inline-block',
                    }}>
                      {msg.retrieved_chunk_ids.length} source chunk{msg.retrieved_chunk_ids.length !== 1 ? 's' : ''} used
                    </span>
                  </div>
                )}
              </div>

              {/* User avatar */}
              {msg.role === 'user' && (
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  background: '#e2e8f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
