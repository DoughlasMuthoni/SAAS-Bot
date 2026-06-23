import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../lib/auth'
import { useWorkspaceStore } from '../../lib/workspace'
import api from '../../lib/api'

const PLAN_STYLE: Record<string, { color: string; bg: string }> = {
  free:       { color: '#64748b', bg: '#f1f5f9' },
  pro:        { color: '#16a34a', bg: '#f0fdf4' },
  enterprise: { color: '#1d4ed8', bg: '#eff6ff' },
}

interface Props {
  onMenuClick: () => void
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
