import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

interface Review {
  id: string
  name: string
  role: string | null
  quote: string
  rating: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  approved: { bg: '#f0fdf4', color: '#16a34a', label: 'Approved' },
  rejected: { bg: '#fef2f2', color: '#dc2626', label: 'Rejected' },
}

function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24"
          fill={i < rating ? '#f59e0b' : '#e2e8f0'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  )
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ReviewsPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('pending')

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ['reviews', statusFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      return api.get(`/reviews?${params}`).then(r => r.data)
    },
    refetchInterval: 30_000,
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/reviews/${id}/status`, { status }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] })
    },
  })

  const counts = { pending: 0, approved: 0, rejected: 0 }
  // We only have the current filter's data; show live count for active tab
  reviews.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1 })

  const TABS = [
    { key: 'pending',  label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: '',         label: 'All' },
  ]

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Reviews</h1>
        <p style={{ color: '#64748b', fontSize: 13.5, marginTop: 4, marginBottom: 0 }}>
          Approve customer reviews before they appear on the demo site.
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => {
          const active = statusFilter === t.key
          const s = STATUS_STYLE[t.key]
          return (
            <button
              key={t.key}
              onClick={() => setStatusFilter(t.key)}
              style={{
                padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                background: active ? (s?.color ?? '#4f46e5') : '#f1f5f9',
                color: active ? '#fff' : '#64748b',
                boxShadow: active ? `0 2px 8px ${s?.color ?? '#4f46e5'}44` : 'none',
                transition: 'all .15s',
              }}
            >
              {t.label}
              {active && reviews.length > 0 && (
                <span style={{ marginLeft: 6, background: 'rgba(255,255,255,.25)', borderRadius: 99, padding: '1px 7px', fontSize: 11 }}>
                  {reviews.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Loading…</div>
      ) : reviews.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⭐</div>
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>No reviews here</div>
          <p style={{ color: '#64748b', fontSize: 13.5, margin: 0 }}>
            {statusFilter === 'pending'
              ? 'No pending reviews to moderate.'
              : `No ${statusFilter || ''} reviews found.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviews.map(r => (
            <div key={r.id} className="card" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                {/* Left */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 14, color: '#fff',
                    }}>
                      {r.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{r.name}</div>
                      {r.role && <div style={{ fontSize: 12, color: '#94a3b8' }}>{r.role}</div>}
                    </div>
                    <Stars rating={r.rating} />
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      background: STATUS_STYLE[r.status]?.bg,
                      color: STATUS_STYLE[r.status]?.color,
                    }}>
                      {STATUS_STYLE[r.status]?.label}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.65, margin: '0 0 8px', fontStyle: 'italic' }}>
                    "{r.quote}"
                  </p>
                  <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{timeAgo(r.created_at)}</div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {r.status !== 'approved' && (
                    <button
                      onClick={() => updateStatus.mutate({ id: r.id, status: 'approved' })}
                      disabled={updateStatus.isPending}
                      style={{
                        padding: '7px 16px', borderRadius: 8, border: '1.5px solid #bbf7d0',
                        background: '#f0fdf4', color: '#16a34a', fontWeight: 700,
                        fontSize: 13, cursor: 'pointer',
                      }}
                    >
                      ✓ Approve
                    </button>
                  )}
                  {r.status !== 'rejected' && (
                    <button
                      onClick={() => updateStatus.mutate({ id: r.id, status: 'rejected' })}
                      disabled={updateStatus.isPending}
                      style={{
                        padding: '7px 16px', borderRadius: 8, border: '1.5px solid #fecaca',
                        background: '#fef2f2', color: '#dc2626', fontWeight: 700,
                        fontSize: 13, cursor: 'pointer',
                      }}
                    >
                      ✕ Reject
                    </button>
                  )}
                  {r.status !== 'pending' && (
                    <button
                      onClick={() => updateStatus.mutate({ id: r.id, status: 'pending' })}
                      disabled={updateStatus.isPending}
                      style={{
                        padding: '7px 16px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                        background: '#f8fafc', color: '#64748b', fontWeight: 700,
                        fontSize: 13, cursor: 'pointer',
                      }}
                    >
                      ↩ Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
