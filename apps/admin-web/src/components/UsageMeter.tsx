import { useNavigate } from 'react-router-dom'

interface MeterProps {
  label: string
  used: number
  limit: number
  color: string
}

function Meter({ label, used, limit, color }: MeterProps) {
  const unlimited = limit === -1
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100))
  const nearLimit = !unlimited && pct >= 80
  const atLimit = !unlimited && pct >= 100
  const barColor = atLimit ? '#dc2626' : nearLimit ? '#d97706' : color

  return (
    <div style={{ flex: '1 1 0', minWidth: 120 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</span>
        <span style={{ fontSize: 12, color: atLimit ? '#dc2626' : nearLimit ? '#d97706' : '#64748b' }}>
          {used}{unlimited ? '' : ` / ${limit}`}
        </span>
      </div>
      {!unlimited && (
        <div style={{ height: 5, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 99, transition: 'width .4s ease' }} />
        </div>
      )}
      {unlimited && (
        <div style={{ height: 5, background: `${color}22`, borderRadius: 99 }}>
          <div style={{ height: '100%', width: '30%', background: `${color}66`, borderRadius: 99 }} />
        </div>
      )}
    </div>
  )
}

function FeatureBadge({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <span style={{
      fontSize: 11.5, fontWeight: 600,
      padding: '3px 9px', borderRadius: 20,
      background: enabled ? '#f0fdf4' : '#f8fafc',
      color: enabled ? '#16a34a' : '#94a3b8',
      border: `1px solid ${enabled ? '#bbf7d0' : '#e2e8f0'}`,
      display: 'inline-flex', alignItems: 'center', gap: 5,
    }}>
      {enabled ? '✓' : '✗'} {label}
    </span>
  )
}

const PLAN_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  free:       { label: 'Free',       color: '#64748b', bg: '#f1f5f9' },
  pro:        { label: 'Pro',        color: '#16a34a', bg: '#f0fdf4' },
  enterprise: { label: 'Enterprise', color: '#1d4ed8', bg: '#eff6ff' },
}

interface UsageData {
  plan: string
  bots:          { used: number; limit: number }
  sources:       { used: number; limit: number }
  conversations: { used: number; limit: number }
  team_members?: { used: number; limit: number }
  allow_crawl?: boolean
  allow_file_upload?: boolean
}

interface Props {
  data: UsageData
  compact?: boolean
}

export default function UsageMeter({ data, compact = false }: Props) {
  const navigate = useNavigate()
  const planMeta = PLAN_LABELS[data.plan] ?? PLAN_LABELS.free

  if (compact) {
    return (
      <span style={{
        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
        background: planMeta.bg, color: planMeta.color, textTransform: 'uppercase', letterSpacing: '.05em',
      }}>
        {planMeta.label}
      </span>
    )
  }

  return (
    <div className="card p-4">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>Plan &amp; Usage</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Current billing period</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            background: planMeta.bg, color: planMeta.color, textTransform: 'uppercase', letterSpacing: '.05em',
          }}>
            {planMeta.label}
          </span>
          {data.plan !== 'enterprise' && (
            <button
              onClick={() => navigate('/billing')}
              style={{
                fontSize: 12, fontWeight: 600, color: '#16a34a',
                background: '#f0fdf4', padding: '3px 10px', borderRadius: 20,
                border: '1px solid #bbf7d0', cursor: 'pointer',
              }}
            >
              {data.plan === 'free' ? 'Upgrade ↗' : 'Manage plan ↗'}
            </button>
          )}
        </div>
      </div>

      {/* Numeric limits */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 14 }}>
        <Meter label="Bots"              used={data.bots.used}          limit={data.bots.limit}          color="#16a34a" />
        <Meter label="Sources"          used={data.sources.used}        limit={data.sources.limit}       color="#1d4ed8" />
        <Meter label="Conversations/mo" used={data.conversations.used}  limit={data.conversations.limit} color="#16a34a" />
        {data.team_members && (
          <Meter label="Team members" used={data.team_members.used} limit={data.team_members.limit} color="#7c3aed" />
        )}
      </div>

      {/* Feature gates */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <FeatureBadge label="File upload"    enabled={data.allow_file_upload ?? true} />
        <FeatureBadge label="Web crawler"    enabled={data.allow_crawl ?? false} />
      </div>

      {data.plan === 'free' && (
        <div style={{ marginTop: 14, padding: '10px 12px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', fontSize: 12.5, color: '#92400e' }}>
          <strong>Free plan:</strong> 1 bot · 5 sources · 500 conversations/month · no web crawler.{' '}
          <button onClick={() => navigate('/billing')} style={{ background: 'none', border: 'none', padding: 0, color: '#d97706', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
            Upgrade to Pro
          </button>{' '}
          for 3 bots, 15 sources, 5,000 conversations, and web crawler.
        </div>
      )}
    </div>
  )
}
