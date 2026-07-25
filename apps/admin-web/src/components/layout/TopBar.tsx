import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../lib/auth'
import { useWorkspaceStore } from '../../lib/workspace'
import api from '../../lib/api'
import { useRole } from '../../hooks/useRole'

const PLAN_STYLE: Record<string, { color: string; bg: string }> = {
  free:       { color: '#64748b', bg: '#f1f5f9' },
  pro:        { color: '#16a34a', bg: '#f0fdf4' },
  enterprise: { color: '#1d4ed8', bg: '#eff6ff' },
}

interface Props {
  onMenuClick: () => void
}

function NotificationBell() {
  const { isAdmin } = useRole()
  const { user } = useAuthStore()
  const isSuperadmin = (user as any)?.is_superadmin === true
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data } = useQuery<{ pending_reviews: number; new_leads: number; total: number }>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications/counts').then(r => r.data),
    refetchInterval: 30_000,
    enabled: isAdmin,
  })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!isAdmin) return null

  const total = data?.total ?? 0

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Notifications"
        style={{
          position: 'relative', background: 'none', border: 'none',
          cursor: 'pointer', padding: '6px 8px', borderRadius: 8,
          color: '#64748b', display: 'flex', alignItems: 'center',
          transition: 'background .15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {total > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            background: '#dc2626', color: '#fff',
            fontSize: 9, fontWeight: 800,
            width: 16, height: 16, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1, border: '1.5px solid #fff',
          }}>
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 6px)',
          width: 260, background: '#fff',
          border: '1px solid #e2e8f0', borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,.12)',
          zIndex: 200, overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>Notifications</div>
          </div>

          {(data?.pending_reviews ?? 0) > 0 && isSuperadmin && (
            <Link
              to="/reviews"
              onClick={() => setOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', textDecoration: 'none', borderBottom: '1px solid #f8fafc' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}
            >
              <div style={{ width: 34, height: 34, borderRadius: 9, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{data!.pending_reviews} review{data!.pending_reviews !== 1 ? 's' : ''} pending</div>
                <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 1 }}>Awaiting your approval</div>
              </div>
            </Link>
          )}

          {(data?.new_leads ?? 0) > 0 && (
            <Link
              to="/leads"
              onClick={() => setOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}
            >
              <div style={{ width: 34, height: 34, borderRadius: 9, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{data!.new_leads} new lead{data!.new_leads !== 1 ? 's' : ''}</div>
                <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 1 }}>Ready for follow-up</div>
              </div>
            </Link>
          )}

          {total === 0 && (
            <div style={{ padding: '20px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              All clear — no pending items
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function TopBar({ onMenuClick }: Props) {
  const { user, logout } = useAuthStore()
  const { workspaces, activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore()

  const { data: usage } = useQuery({
    queryKey: ['usage', activeWorkspaceId],
    queryFn: () => api.get(`/analytics/usage?workspace_id=${activeWorkspaceId}`).then(r => r.data),
    enabled: !!activeWorkspaceId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
  const plan = usage?.plan ?? 'free'
  const planStyle = PLAN_STYLE[plan] ?? PLAN_STYLE.free

  return (
    <header className="cb-topbar">
      <button className="cb-hamburger" onClick={onMenuClick} aria-label="Open menu">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        {workspaces.length > 0 && (
          <>
            <span style={{ fontSize: 13, color: '#9ca3af' }}>Workspace</span>
            {workspaces.length > 1 ? (
              <select
                className="form-select form-select-sm"
                style={{ width: 'auto', maxWidth: 180, fontSize: 13 }}
                value={activeWorkspaceId ?? ''}
                onChange={(e) => setActiveWorkspace(e.target.value)}
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>{ws.name}</option>
                ))}
              </select>
            ) : (
              <span style={{
                fontSize: 13, fontWeight: 600, color: '#374151',
                background: '#f1f5f9', padding: '3px 10px', borderRadius: 20,
                border: '1px solid #e2e8f0',
              }}>
                {workspaces[0]?.name}
              </span>
            )}
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <NotificationBell />
        {usage && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
            background: planStyle.bg, color: planStyle.color,
            textTransform: 'uppercase', letterSpacing: '.05em',
          }}>
            {plan}
          </span>
        )}
        <span style={{ fontSize: 13, color: '#6b7280', display: 'none' }} className="d-md-inline">
          {user?.email}
        </span>
        <button
          className="btn btn-sm btn-outline-danger"
          style={{ fontSize: 13, padding: '4px 12px', borderRadius: 8 }}
          onClick={logout}
        >
          Logout
        </button>
      </div>
    </header>
  )
}
