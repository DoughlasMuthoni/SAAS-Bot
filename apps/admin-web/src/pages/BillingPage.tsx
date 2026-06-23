import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWorkspaceId } from '../hooks/useWorkspaceId'
import api from '../lib/api'
import UsageMeter from '../components/UsageMeter'

type Currency = 'KES' | 'USD'

interface ApiPlan {
  id: string
  name: string
  slug: string
  description: string | null
  price_kes: number
  price_usd: number
  max_bots: number
  max_sources: number
  max_conversations_per_month: number
  is_default: boolean
  features: string[] | null
}

// Visual style per slug — display concern only, not stored in DB
const SLUG_STYLE: Record<string, { color: string; bg: string }> = {
  free:       { color: '#64748b', bg: '#f1f5f9' },
  pro:        { color: '#16a34a', bg: '#f0fdf4' },
  enterprise: { color: '#1d4ed8', bg: '#eff6ff' },
}
const DEFAULT_STYLE = { color: '#7c3aed', bg: '#f5f3ff' }

function planStyle(slug: string) {
  return SLUG_STYLE[slug] ?? DEFAULT_STYLE
}

function limitLabel(v: number) {
  if (v === -1) return 'Unlimited'
  return v.toLocaleString()
}

function formatPrice(v: number, currency: Currency) {
  if (v === 0) return 'Free'
  if (currency === 'KES') return v.toLocaleString()
  return v.toLocaleString()
}

function pricePeriod(plan: ApiPlan) {
  return plan.price_kes === 0 && plan.price_usd === 0 ? 'forever' : 'per month'
}

const FAQS = [
  { q: 'How do I upgrade?', a: 'Email us at info@douglasgithui.co.ke with your plan choice in the subject. We will enable your new plan within 24 hours.' },
  { q: 'Is there a contract or lock-in?', a: 'No. Paid plans are billed monthly and you can cancel at any time with no fees.' },
  { q: 'Can I pay with M-Pesa?', a: 'Yes. We accept M-Pesa and card payments. Contact us and we will send you the appropriate payment details.' },
  { q: 'What happens when I hit my limits?', a: 'The API returns an error and the admin shows an upgrade prompt. Existing content and conversations are preserved — you just cannot add more until you upgrade or the period resets.' },
  { q: 'Can I get a trial of a paid plan?', a: 'Yes — contact us and we can enable a 14-day trial on your account at no charge.' },
]

function Check({ ok }: { ok: boolean }) {
  return ok ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}>
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

function PlanCardSkeleton() {
  return (
    <div className="col-md-4">
      <div style={{ background: '#fff', borderRadius: 16, border: '2px solid #e2e8f0', padding: '1.5rem', minHeight: 360 }}>
        <div style={{ background: '#f1f5f9', borderRadius: 8, height: 22, width: '40%', marginBottom: 12 }} />
        <div style={{ background: '#f1f5f9', borderRadius: 8, height: 40, width: '60%', marginBottom: 8 }} />
        <div style={{ background: '#f1f5f9', borderRadius: 8, height: 14, width: '30%', marginBottom: 20 }} />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ background: '#f8fafc', borderRadius: 6, height: 13, width: `${60 + i * 5}%`, marginBottom: 8 }} />
        ))}
      </div>
    </div>
  )
}

export default function BillingPage() {
  const workspaceId = useWorkspaceId()
  const [currency, setCurrency] = useState<Currency>('KES')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const { data: usage } = useQuery({
    queryKey: ['usage', workspaceId],
    queryFn: () => api.get(`/analytics/usage?workspace_id=${workspaceId}`).then(r => r.data),
    enabled: !!workspaceId,
    staleTime: 30_000,
  })

  // Fetch live plan data from API — staleTime:0 so changes from Plans admin page
  // are always visible immediately on navigation back here
  const { data: plans = [], isLoading: plansLoading } = useQuery<ApiPlan[]>({
    queryKey: ['plans-public'],
    queryFn: () => api.get('/plans').then(r => r.data),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const currentPlan: string = usage?.plan ?? 'free'
  const isOnFree = currentPlan === 'free'
  const currentPlanData = plans.find(p => p.slug === currentPlan)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* ── Page header ──────────────────────────────────────────── */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Billing & Plans</h4>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
          Manage your subscription and view your current usage.
        </p>
      </div>

      {/* ── Current plan + usage ──────────────────────────────────── */}
      {usage && (
        <div className="mb-4">
          <UsageMeter data={usage} />
        </div>
      )}

      {/* ── Free / upgrade banner ─────────────────────────────────── */}
      {isOnFree && (
        <div style={{
          background: 'linear-gradient(135deg, #15803d 0%, #16a34a 60%, #1d4ed8 100%)',
          borderRadius: 14, padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 14,
          boxShadow: '0 4px 20px rgba(22,163,74,.25)',
        }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', marginBottom: 3 }}>
              🚀 You're on the Free plan
            </div>
            <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 13.5 }}>
              {plans.find(p => p.slug === 'pro')
                ? `Upgrade to ${plans.find(p => p.slug === 'pro')!.name} for ${plans.find(p => p.slug === 'pro')!.max_bots} bots, ${plans.find(p => p.slug === 'pro')!.max_sources} sources, and ${limitLabel(plans.find(p => p.slug === 'pro')!.max_conversations_per_month)} conversations/month.`
                : 'Upgrade for more bots, sources, and conversations.'}
            </div>
          </div>
          <a
            href="mailto:info@douglasgithui.co.ke?subject=Upgrade%20Plan"
            style={{
              background: '#fff', color: '#16a34a',
              padding: '10px 22px', borderRadius: 10,
              fontWeight: 700, fontSize: 13.5, textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,.15)', flexShrink: 0,
            }}
          >
            Upgrade →
          </a>
        </div>
      )}

      {/* ── Currency toggle ───────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 10 }}>
        <h6 style={{ fontWeight: 700, color: '#374151', margin: 0, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          Compare plans
        </h6>
        <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: 10, padding: 4, border: '1px solid #e2e8f0', gap: 2 }}>
          {(['KES', 'USD'] as Currency[]).map(c => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              style={{
                border: 'none', borderRadius: 7, padding: '6px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                background: currency === c ? '#fff' : 'transparent',
                color: currency === c ? '#16a34a' : '#64748b',
                boxShadow: currency === c ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
                transition: 'all .15s',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── Plan cards ───────────────────────────────────────────── */}
      <div className="row g-3 mb-4" style={{ alignItems: 'start' }}>
        {plansLoading
          ? [1, 2, 3].map(i => <PlanCardSkeleton key={i} />)
          : plans.map((plan) => {
              const rawPrice = currency === 'KES' ? plan.price_kes : plan.price_usd
              const price = formatPrice(rawPrice, currency)
              const isCustom = rawPrice === 0 && plan.slug === 'enterprise'
              const isCurrent = currentPlan === plan.slug
              const style = planStyle(plan.slug)
              const period = pricePeriod(plan)
              const isUpgradeable = plan.slug !== 'free' && plan.slug !== currentPlan

              return (
                <div key={plan.id} className="col-md-4">
                  <div style={{
                    background: '#fff', borderRadius: 16,
                    border: `2px solid ${isCurrent ? style.color : '#e2e8f0'}`,
                    padding: '1.5rem',
                    boxShadow: isCurrent ? `0 4px 20px ${style.color}22` : '0 1px 4px rgba(0,0,0,.06)',
                    position: 'relative',
                    display: 'flex', flexDirection: 'column',
                  }}>
                    {isCurrent && (
                      <div style={{
                        position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                        background: style.color, color: '#fff',
                        fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 99,
                        letterSpacing: '.05em', whiteSpace: 'nowrap',
                      }}>
                        YOUR CURRENT PLAN
                      </div>
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: style.bg, color: style.color,
                        fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                        marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em',
                      }}>
                        {plan.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                        {!isCustom && price !== 'Free' && (
                          <span style={{ fontSize: 15, fontWeight: 700, color: '#64748b', alignSelf: 'flex-start', marginTop: 6 }}>
                            {currency === 'KES' ? 'KES' : '$'}
                          </span>
                        )}
                        <span style={{ fontSize: isCustom ? '1.6rem' : '2.2rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-.02em' }}>
                          {isCustom ? 'Custom' : price}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{period}</div>
                    </div>

                    {plan.description && (
                      <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 12px', lineHeight: 1.55 }}>
                        {plan.description}
                      </p>
                    )}

                    <hr style={{ borderColor: '#f1f5f9', margin: '0 0 1rem' }} />

                    {/* Limits as check-items */}
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {/* Core limits always shown */}
                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#374151' }}>
                        <Check ok={true} />
                        {plan.max_bots === -1 ? 'Unlimited chatbots' : `${plan.max_bots} chatbot${plan.max_bots !== 1 ? 's' : ''}`}
                      </li>
                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#374151' }}>
                        <Check ok={true} />
                        {plan.max_sources === -1 ? 'Unlimited sources' : `${plan.max_sources} knowledge sources`}
                      </li>
                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#374151' }}>
                        <Check ok={true} />
                        {plan.max_conversations_per_month === -1 ? 'Unlimited conversations' : `${limitLabel(plan.max_conversations_per_month)} conversations / month`}
                      </li>
                      {/* Extra features from DB */}
                      {(plan.features ?? []).map((f, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#374151' }}>
                          <Check ok={true} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    {isCurrent ? (
                      <div style={{
                        textAlign: 'center', fontSize: 13, fontWeight: 600,
                        color: style.color, background: style.bg,
                        padding: '10px', borderRadius: 9, border: `1px solid ${style.color}44`,
                      }}>
                        ✓ Active plan
                      </div>
                    ) : isUpgradeable ? (
                      <a
                        href={`mailto:info@douglasgithui.co.ke?subject=Upgrade%20to%20${encodeURIComponent(plan.name)}`}
                        style={{
                          display: 'block', textAlign: 'center',
                          background: style.color, color: '#fff',
                          padding: '11px', borderRadius: 9,
                          fontWeight: 700, fontSize: 13.5, textDecoration: 'none',
                          boxShadow: `0 2px 8px ${style.color}33`,
                        }}
                      >
                        {plan.slug === 'enterprise' ? 'Contact sales' : `Upgrade to ${plan.name}`}
                      </a>
                    ) : null}
                  </div>
                </div>
              )
            })
        }
      </div>

      <p style={{ fontSize: 12.5, color: '#94a3b8', textAlign: 'center', marginBottom: '2.5rem' }}>
        {currency === 'KES'
          ? 'Prices in Kenyan Shillings (KES) · M-Pesa & card accepted · Exclude VAT'
          : 'Prices in US Dollars (USD) · Card accepted · Exclude tax'}
        {' · '}Contact <a href="mailto:info@douglasgithui.co.ke" style={{ color: '#16a34a' }}>info@douglasgithui.co.ke</a> to upgrade
      </p>

      {/* ── Restrictions table (dynamic from API) ────────────────── */}
      {!plansLoading && plans.length > 0 && (
        <div className="card mb-4" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
            <h6 style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: 14 }}>Plan limits at a glance</h6>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table table-hover mb-0" style={{ fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ fontWeight: 700, color: '#374151', paddingLeft: '1.25rem' }}>Limit</th>
                  {plans.map(p => (
                    <th key={p.slug} style={{ textAlign: 'center', color: planStyle(p.slug).color, fontWeight: 700 }}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Chatbots',             getValue: (p: ApiPlan) => limitLabel(p.max_bots) },
                  { label: 'Knowledge sources',    getValue: (p: ApiPlan) => limitLabel(p.max_sources) },
                  { label: 'Conversations / month', getValue: (p: ApiPlan) => limitLabel(p.max_conversations_per_month) },
                  {
                    label: `Price (${currency})`,
                    getValue: (p: ApiPlan) => {
                      const v = currency === 'KES' ? p.price_kes : p.price_usd
                      if (v === 0 && p.slug === 'enterprise') return 'Custom'
                      if (v === 0) return 'Free'
                      return `${currency === 'KES' ? 'KES ' : '$'}${v.toLocaleString()}/mo`
                    },
                  },
                ].map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500, paddingLeft: '1.25rem', color: '#374151' }}>{row.label}</td>
                    {plans.map(p => (
                      <td key={p.slug} style={{ textAlign: 'center', color: planStyle(p.slug).color, fontWeight: 600 }}>
                        {row.getValue(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '2rem' }}>
        <h6 style={{ fontWeight: 700, color: '#374151', marginBottom: '1rem', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          Frequently asked questions
        </h6>
        {FAQS.map((f, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 8, overflow: 'hidden' }}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{
                width: '100%', textAlign: 'left', border: 'none', background: 'transparent',
                padding: '1rem 1.25rem', fontSize: 14, fontWeight: 600, color: '#1e293b',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, cursor: 'pointer',
              }}
            >
              {f.q}
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"
                style={{ flexShrink: 0, transition: 'transform .2s', transform: openFaq === i ? 'rotate(180deg)' : 'none' }}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {openFaq === i && (
              <div style={{ padding: '0 1.25rem 1rem', fontSize: 13.5, color: '#64748b', lineHeight: 1.65 }}>{f.a}</div>
            )}
          </div>
        ))}
      </div>

      {/* ── Contact block ─────────────────────────────────────────── */}
      <div style={{
        background: '#f8fafc', borderRadius: 14, padding: '1.5rem',
        border: '1px solid #e2e8f0', textAlign: 'center',
      }}>
        <div style={{ fontSize: 22, marginBottom: 8 }}>💬</div>
        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Questions about pricing?</div>
        <div style={{ fontSize: 13.5, color: '#64748b', marginBottom: '1rem' }}>
          We're happy to help. Get in touch and we'll find the right plan for you.
        </div>
        <a
          href="mailto:info@douglasgithui.co.ke"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: '#16a34a', color: '#fff',
            padding: '10px 24px', borderRadius: 10,
            fontWeight: 700, fontSize: 13.5, textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(22,163,74,.3)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/>
          </svg>
          info@douglasgithui.co.ke
        </a>
      </div>
    </div>
  )
}
