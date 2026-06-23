import { useQuery } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../lib/auth'
import { useWorkspaceId } from '../hooks/useWorkspaceId'
import UsageMeter from '../components/UsageMeter'

const STATS = [
  {
    key: 'total_conversations',
    label: 'Conversations',
    color: '#16a34a',
    bg: '#f0fdf4',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    ),
  },
  {
    key: 'total_messages',
    label: 'Messages',
    color: '#1d4ed8',
    bg: '#eff6ff',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <path d="M22 6l-10 7L2 6"/>
      </svg>
    ),
  },
  {
    key: 'unresolved_count',
    label: 'Unresolved',
    color: '#dc2626',
    bg: '#fef2f2',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
  {
    key: 'lead_count',
    label: 'Leads',
    color: '#15803d',
    bg: '#dcfce7',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/>
      </svg>
    ),
  },
]

const QUICK_LINKS = [
  { label: 'Create a Bot',       desc: 'Set up a new AI chatbot',        to: '/bots',          color: '#16a34a', bg: '#f0fdf4' },
  { label: 'Add Knowledge',      desc: 'Upload content for your bot',     to: '/sources',       color: '#1d4ed8', bg: '#eff6ff' },
  { label: 'View Conversations', desc: 'Read visitor chats',              to: '/conversations', color: '#7c3aed', bg: '#faf5ff' },
  { label: 'Manage Leads',       desc: 'Follow up with visitors',         to: '/leads',         color: '#dc2626', bg: '#fef2f2' },
]

function StatSkeleton() {
  return (
    <div className="cb-stat">
      <div className="cb-stat-icon" style={{ background: '#f1f5f9' }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 28, width: 60, background: '#e2e8f0', borderRadius: 6, marginBottom: 6 }} />
        <div style={{ height: 12, width: 80, background: '#f1f5f9', borderRadius: 4 }} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const workspaceId = useWorkspaceId()
  const navigate = useNavigate()

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', workspaceId],
    queryFn: () => api.get(`/analytics/overview?workspace_id=${workspaceId}`).then(r => r.data),
    enabled: !!workspaceId,
  })

  const { data: bots = [] } = useQuery<any[]>({
    queryKey: ['bots', workspaceId],
    queryFn: () => api.get(`/bots?workspace_id=${workspaceId}`).then(r => r.data),
    enabled: !!workspaceId,
  })

  const { data: usage } = useQuery({
    queryKey: ['usage', workspaceId],
    queryFn: () => api.get(`/analytics/usage?workspace_id=${workspaceId}`).then(r => r.data),
    enabled: !!workspaceId,
  })

  const isNewAccount = bots.length === 0
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  return (
    <div>
      {/* ── Page header ─────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1.75rem', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h4 style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: '1.35rem' }}>
            {greeting}, {name} 👋
          </h4>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Here's what's happening with your chatbots today.
          </p>
        </div>
        <Link
          to="/bots"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: '#16a34a', color: '#fff',
            padding: '9px 18px', borderRadius: 10,
            fontWeight: 600, fontSize: 13.5, textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(22,163,74,.3)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Bot
        </Link>
      </div>

      {/* ── Onboarding banner ────────────────────────────────── */}
      {isNewAccount && (
        <div style={{
          background: 'linear-gradient(135deg, #15803d 0%, #16a34a 50%, #1d4ed8 100%)',
          borderRadius: 14, padding: '1.5rem 2rem',
          marginBottom: '1.75rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
          boxShadow: '0 4px 20px rgba(22,163,74,.3)',
        }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', marginBottom: 4 }}>
              🚀 Welcome! Let's set up your first chatbot
            </div>
            <div style={{ color: 'rgba(255,255,255,.85)', fontSize: 13.5, maxWidth: 480 }}>
              Create a bot, add your knowledge base, then paste one line of code on your website. Takes about 5 minutes.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <Link to="/bots" style={{
              background: '#fff', color: '#16a34a',
              padding: '9px 20px', borderRadius: 9,
              fontWeight: 700, fontSize: 13.5, textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,.15)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Create a Bot
            </Link>
            <Link to="/sources" style={{
              background: 'rgba(255,255,255,.15)', color: '#fff',
              padding: '9px 20px', borderRadius: 9,
              fontWeight: 600, fontSize: 13.5, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,.3)',
            }}>
              Add Knowledge
            </Link>
          </div>
        </div>
      )}

      {/* ── Stat cards ───────────────────────────────────────── */}
      <div className="row g-3 mb-4">
        {STATS.map((s) => (
          <div key={s.key} className="col-6 col-lg-3">
            {isLoading ? (
              <StatSkeleton />
            ) : (
              <div className="cb-stat">
                <div className="cb-stat-icon" style={{ background: s.bg }}>
                  {s.icon}
                </div>
                <div>
                  <div className="cb-stat-value" style={{ color: s.color }}>
                    {analytics?.[s.key] ?? 0}
                  </div>
                  <div className="cb-stat-label">{s.label}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Usage meter ──────────────────────────────────────── */}
      {usage && (
        <div className="mb-4">
          <UsageMeter data={usage} />
        </div>
      )}

      {/* ── Quick actions ────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h6 style={{
          fontWeight: 700, color: '#374151', marginBottom: '0.75rem',
          fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em',
        }}>
          Quick actions
        </h6>
        <div className="row g-3">
          {QUICK_LINKS.map((link) => (
            <div key={link.to} className="col-6 col-md-3">
              <button
                className="w-100 text-start border-0 p-3"
                style={{
                  background: '#fff', borderRadius: 12,
                  border: `1px solid rgba(0,0,0,.07)`,
                  boxShadow: '0 1px 3px rgba(0,0,0,.06)',
                  cursor: 'pointer', transition: 'transform .15s, box-shadow .15s',
                }}
                onClick={() => navigate(link.to)}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = 'translateY(-2px)'
                  el.style.boxShadow = '0 6px 20px rgba(0,0,0,.1)'
                  el.style.borderColor = link.color + '44'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = ''
                  el.style.boxShadow = '0 1px 3px rgba(0,0,0,.06)'
                  el.style.borderColor = 'rgba(0,0,0,.07)'
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: link.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 10,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: link.color }} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1e293b', marginBottom: 3 }}>{link.label}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{link.desc}</div>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Active bots summary ──────────────────────────────── */}
      {bots.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
            <h6 style={{ fontWeight: 700, color: '#374151', margin: 0, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Your Bots
            </h6>
            <Link to="/bots" style={{ fontSize: 12, color: '#16a34a', textDecoration: 'none', fontWeight: 600 }}>
              View all →
            </Link>
          </div>
          <div className="card p-0" style={{ overflow: 'hidden' }}>
            {bots.slice(0, 5).map((bot: any, i: number) => (
              <div
                key={bot.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px',
                  borderBottom: i < Math.min(bots.length, 5) - 1 ? '1px solid #f1f5f9' : 'none',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/bots/${bot.id}`)}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: bot.brand_color || '#16a34a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>
                  🤖
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {bot.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {bot.is_active ? '● Active' : '○ Inactive'}
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
