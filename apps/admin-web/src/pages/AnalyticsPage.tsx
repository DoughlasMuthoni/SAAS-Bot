import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { useWorkspaceId } from '../hooks/useWorkspaceId'

interface DailyUsage { date: string; conversations: number; messages: number }
interface QueryFrequency { query: string; count: number }
interface Overview {
  total_conversations: number
  total_messages: number
  unresolved_count: number
  lead_count: number
  top_queries: QueryFrequency[]
  usage_by_day: DailyUsage[]
}

const STATS = [
  {
    key: 'total_conversations' as const,
    label: 'Total Conversations',
    color: '#4f46e5', bg: '#eef2ff',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  },
  {
    key: 'total_messages' as const,
    label: 'Total Messages',
    color: '#0891b2', bg: '#ecfeff',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>,
  },
  {
    key: 'unresolved_count' as const,
    label: 'Unresolved Queries',
    color: '#d97706', bg: '#fffbeb',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  },
  {
    key: 'lead_count' as const,
    label: 'Leads Captured',
    color: '#16a34a', bg: '#f0fdf4',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/></svg>,
  },
]

export default function AnalyticsPage() {
  const workspaceId = useWorkspaceId()

  const { data, isLoading } = useQuery<Overview>({
    queryKey: ['analytics', workspaceId],
    queryFn: () => api.get(`/analytics/overview?workspace_id=${workspaceId}`).then(r => r.data),
    enabled: !!workspaceId,
    refetchInterval: 60_000,
  })

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
      <div className="cb-spinner" />
    </div>
  )

  const days = [...(data?.usage_by_day ?? [])].reverse().slice(-14)
  const maxConvs = Math.max(...days.map(d => d.conversations), 1)

  const resolvedRate = data
    ? data.total_conversations > 0
      ? Math.round(((data.total_conversations - data.unresolved_count) / data.total_conversations) * 100)
      : 100
    : 0

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h4 style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: '1.3rem' }}>Analytics</h4>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Last 30 days · updates every minute</p>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        {STATS.map((s) => (
          <div key={s.key} className="col-6 col-lg-3">
            <div className="cb-stat">
              <div className="cb-stat-icon" style={{ background: s.bg }}>{s.icon}</div>
              <div>
                <div className="cb-stat-value">{data?.[s.key] ?? 0}</div>
                <div className="cb-stat-label">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        {/* Daily conversations chart */}
        <div className="col-lg-8">
          <div className="card p-4" style={{ height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>Daily Conversations</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Last 14 days</div>
              </div>
              {days.length > 0 && (
                <div style={{ fontSize: 13, color: '#4f46e5', fontWeight: 600 }}>
                  {days.reduce((a, d) => a + d.conversations, 0)} total
                </div>
              )}
            </div>

            {days.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 180, color: '#94a3b8', gap: 8 }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
                <span style={{ fontSize: 13 }}>No conversation data yet</span>
              </div>
            ) : (
              <BarChart days={days} maxConvs={maxConvs} />
            )}
          </div>
        </div>

        {/* Resolution rate */}
        <div className="col-lg-4">
          <div className="card p-4" style={{ height: '100%' }}>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 15, marginBottom: 4 }}>Resolution Rate</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>Answered vs unanswered</div>

            <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <DonutChart rate={resolvedRate} />
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: '#4f46e5' }} />
                    Resolved
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                    {(data?.total_conversations ?? 0) - (data?.unresolved_count ?? 0)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: '#e2e8f0' }} />
                    Unresolved
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                    {data?.unresolved_count ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top unresolved queries */}
        <div className="col-12">
          <div className="card p-4">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>Top Unanswered Queries</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Questions your bot couldn't answer</div>
              </div>
              {(data?.top_queries?.length ?? 0) > 0 && (
                <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 600, fontSize: 11 }}>
                  {data?.top_queries.length} unique
                </span>
              )}
            </div>

            {(data?.top_queries?.length ?? 0) === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                <div style={{ fontSize: 13 }}>No unanswered queries — great knowledge coverage!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {data!.top_queries.map((q, i) => {
                  const maxCount = data!.top_queries[0].count
                  const pct = Math.round((q.count / maxCount) * 100)
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '9px 12px', borderRadius: 8,
                      background: i % 2 === 0 ? '#f8fafc' : '#fff',
                    }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        background: '#f1f5f9', color: '#64748b',
                        fontSize: 11, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, color: '#1e293b', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {q.query}
                        </div>
                        <div style={{ height: 4, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: '#d97706', borderRadius: 4, transition: 'width .3s' }} />
                        </div>
                      </div>
                      <span style={{
                        fontSize: 12, fontWeight: 700, color: '#d97706',
                        background: '#fffbeb', padding: '2px 8px', borderRadius: 12,
                        flexShrink: 0,
                      }}>{q.count}×</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function BarChart({ days, maxConvs }: { days: DailyUsage[]; maxConvs: number }) {
  const chartH = 160

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: chartH }}>
        {days.map((d, i) => {
          const barH = maxConvs > 0 ? Math.max(4, Math.round((d.conversations / maxConvs) * chartH)) : 4
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end', position: 'relative' }} title={`${d.date}: ${d.conversations} conversations`}>
              {d.conversations > 0 && (
                <div style={{
                  position: 'absolute',
                  bottom: barH + 4,
                  fontSize: 10,
                  color: '#4f46e5',
                  fontWeight: 600,
                  opacity: days.length <= 10 ? 1 : 0,
                  whiteSpace: 'nowrap',
                }}>
                  {d.conversations}
                </div>
              )}
              <div style={{
                width: '100%',
                height: barH,
                background: `linear-gradient(to top, #4f46e5, #818cf8)`,
                borderRadius: '4px 4px 0 0',
                transition: 'height .3s ease',
              }} />
            </div>
          )
        })}
      </div>
      {/* X axis labels */}
      <div style={{ display: 'flex', gap: 4 }}>
        {days.map((d, i) => {
          const date = new Date(d.date)
          const label = `${date.getMonth() + 1}/${date.getDate()}`
          const show = days.length <= 10 || i % Math.ceil(days.length / 7) === 0
          return (
            <div key={i} style={{
              flex: 1, fontSize: 10, color: '#94a3b8', textAlign: 'center',
              opacity: show ? 1 : 0, whiteSpace: 'nowrap', overflow: 'hidden',
            }}>{label}</div>
          )
        })}
      </div>
    </div>
  )
}

function DonutChart({ rate }: { rate: number }) {
  const r = 48
  const cx = 60
  const cy = 60
  const circ = 2 * Math.PI * r
  const filled = (rate / 100) * circ
  const gap = circ - filled

  return (
    <div style={{ position: 'relative', width: 120, height: 120 }}>
      <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="14" />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#4f46e5"
          strokeWidth="14"
          strokeDasharray={`${filled} ${gap}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray .6s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{rate}%</div>
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>resolved</div>
      </div>
    </div>
  )
}
