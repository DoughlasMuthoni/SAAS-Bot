import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

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
  plan_expires_at?: string | null
  bots:          { used: number; limit: number }
  sources:       { used: number; limit: number }
  conversations: { used: number; limit: number }
  team_members?: { used: number; limit: number }
  allow_crawl?: boolean
  allow_file_upload?: boolean
  allow_custom_branding?: boolean
}

interface ApiPlan {
  slug: string
  name: string
  max_bots: number
  max_sources: number
  max_conversations_per_month: number
  allow_crawl: boolean
}

interface Props {
  data: UsageData
  compact?: boolean
}

function limitStr(v: number) {
  return v === -1 ? 'unlimited' : v.toLocaleString()
}

function trialCountdown(expiresAt: string | null | undefined): { daysLeft: number; expired: boolean } | null {
  if (!expiresAt) return null
  const diff = new Date(expiresAt).getTime() - Date.now()
  const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return { daysLeft: Math.max(daysLeft, 0), expired: diff <= 0 }
}

export default function UsageMeter({ data, compact = false }: Props) {
  const navigate = useNavigate()
  const planMeta = PLAN_LABELS[data.plan] ?? PLAN_LABELS.free
  const trial = data.plan === 'free' ? trialCountdown(data.plan_expires_at) : null

  const { data: plans = [] } = useQuery<ApiPlan[]>({
    queryKey: ['plans-public'],
    queryFn: () => fetch('/api/v1/public/plans').then(r => r.json()),
    staleTime: 5 * 60_000,
    enabled: data.plan !== 'enterprise',
  })

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

      {/* Trial countdown banner */}
      {trial && (
        <div style={{
          marginBottom: 14,
          padding: '10px 14px',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: trial.expired ? '#fef2f2' : trial.daysLeft <= 1 ? '#fff7ed' : '#f0f9ff',
          border: `1px solid ${trial.expired ? '#fecaca' : trial.daysLeft <= 1 ? '#fed7aa' : '#bae6fd'}`,
          fontSize: 13,
          color: trial.expired ? '#dc2626' : trial.daysLeft <= 1 ? '#c2410c' : '#0369a1',
        }}>
          <span style={{ fontSize: 18 }}>{trial.expired ? '🔒' : trial.daysLeft <= 1 ? '⚠️' : '⏳'}</span>
          <div style={{ flex: 1 }}>
            {trial.expired
              ? <><strong>Free trial expired.</strong> Your chatbot is no longer accepting new conversations.</>
              : trial.daysLeft <= 1
              ? <><strong>Last day of your free trial!</strong> Upgrade today to keep your chatbot running.</>
              : <><strong>{trial.daysLeft} day{trial.daysLeft !== 1 ? 's' : ''} left</strong> on your free trial.</>
            }
          </div>
          <button
            onClick={() => navigate('/billing')}
            style={{
              fontSize: 12, fontWeight: 700,
              padding: '4px 12px', borderRadius: 20,
              background: trial.expired ? '#dc2626' : trial.daysLeft <= 1 ? '#ea580c' : '#0284c7',
              color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            Upgrade now
          </button>
        </div>
      )}

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
        <FeatureBadge label="File upload"      enabled={data.allow_file_upload ?? true} />
        <FeatureBadge label="Web crawler"      enabled={data.allow_crawl ?? false} />
        <FeatureBadge label="Custom branding"  enabled={data.allow_custom_branding ?? false} />
      </div>

      {data.plan !== 'enterprise' && (() => {
        const currentPlanObj = plans.find(p => p.slug === data.plan)
        const upgradePlan = plans.find(p => p.slug !== data.plan && p.slug !== 'free')
        if (!upgradePlan) return null

        const currentDesc = [
          `${limitStr(data.bots.limit)} bot${data.bots.limit === 1 ? '' : 's'}`,
          `${limitStr(data.sources.limit)} sources`,
          `${limitStr(data.conversations.limit)} conversations/month`,
          data.allow_crawl ? 'web crawler' : 'no web crawler',
        ].join(' · ')

        const upgradeDesc = [
          `${limitStr(upgradePlan.max_bots)} bot${upgradePlan.max_bots === 1 ? '' : 's'}`,
          `${limitStr(upgradePlan.max_sources)} sources`,
          `${limitStr(upgradePlan.max_conversations_per_month)} conversations`,
          upgradePlan.allow_crawl ? 'web crawler' : null,
        ].filter(Boolean).join(', ')

        const currentLabel = currentPlanObj?.name ?? (data.plan.charAt(0).toUpperCase() + data.plan.slice(1))

        return (
          <div style={{ marginTop: 14, padding: '10px 12px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', fontSize: 12.5, color: '#92400e' }}>
            <strong>{currentLabel} plan:</strong> {currentDesc}.{' '}
            <button onClick={() => navigate('/billing')} style={{ background: 'none', border: 'none', padding: 0, color: '#d97706', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
              Upgrade to {upgradePlan.name}
            </button>{' '}
            for {upgradeDesc}.
          </div>
        )
      })()}
    </div>
  )
}
