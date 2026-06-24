import { NavLink, Link } from 'react-router-dom'
import { useAuthStore } from '../../lib/auth'
import { useRole } from '../../hooks/useRole'

const NAV_MAIN = [
  {
    label: 'Dashboard', to: '/dashboard',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
  },
  {
    label: 'Bots', to: '/bots',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="9" width="14" height="12" rx="2"/><path d="M9 9V7a3 3 0 016 0v2"/><path d="M12 4v2"/><circle cx="9" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="14" r="1" fill="currentColor" stroke="none"/><path d="M9 18h6"/></svg>,
  },
  {
    label: 'Knowledge', to: '/sources',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v4c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 9v6c0 1.66 4.03 3 9 3s9-1.34 9-3V9"/></svg>,
  },
  {
    label: 'Conversations', to: '/conversations',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  },
  {
    label: 'Leads', to: '/leads',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/></svg>,
  },
  {
    label: 'Analytics', to: '/analytics',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  },
]

const NAV_ACCOUNT = [
  {
    label: 'Team', to: '/team',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/></svg>,
    adminOnly: true, ownerOnly: false,
  },
  {
    label: 'Billing', to: '/billing',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    adminOnly: true, ownerOnly: false,
  },
  {
    label: 'Plans', to: '/plans',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    adminOnly: false, ownerOnly: true,
  },
]

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: Props) {
  const { user } = useAuthStore()
  const { isAdmin } = useRole()

  const renderLink = (item: { label: string; to: string; icon: React.ReactNode }) => (
    <NavLink
      key={item.to}
      to={item.to}
      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
      onClick={onClose}
    >
      {item.icon}
      {item.label}
    </NavLink>
  )

  return (
    <nav className={`cb-sidebar ${isOpen ? 'is-open' : ''}`}>
      <div className="cb-sidebar-brand">
        <div className="cb-sidebar-logo" style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            background: '#fff', borderRadius: 8, padding: '5px 10px',
            display: 'flex', alignItems: 'center',
          }}>
            <img src="/logo.jpeg" alt="DG ChatBot" style={{ height: 30, width: 'auto', objectFit: 'contain', display: 'block' }} />
          </div>
        </div>
        <button className="cb-close-btn" onClick={onClose} aria-label="Close sidebar">✕</button>
      </div>

      <div style={{ flex: 1 }}>
        <div className="cb-sidebar-section">Menu</div>
        {NAV_MAIN.map(renderLink)}

        <div className="cb-sidebar-section" style={{ marginTop: '0.75rem' }}>Account</div>
        {NAV_ACCOUNT
          .filter(item => !item.ownerOnly || user?.is_superadmin === true)
          .filter(item => !item.adminOnly || isAdmin)
          .map(renderLink)}

        <div className="cb-sidebar-section" style={{ marginTop: '0.75rem' }}>Legal</div>
        {[
          { to: '/privacy', label: 'Privacy Policy', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
          { to: '/terms',   label: 'Terms of Service', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
          { to: '/security',label: 'Security', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },
        ].map(item => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onClose}
            className="nav-link"
          >
            {item.icon}
            {item.label}
          </Link>
        ))}

        {/* Content editor — superadmin only */}
        {user?.is_superadmin && (
          <>
            <div className="cb-sidebar-section" style={{ marginTop: '0.75rem' }}>Platform</div>
            <NavLink
              to="/content"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Content Pages
            </NavLink>
          </>
        )}
      </div>

      {user && (
        <div className="cb-sidebar-footer">
          <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg,#16a34a,#15803d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.full_name || user.email}
              </div>
              <div style={{ fontSize: 10, color: '#64748b', textTransform: 'capitalize' }}>{user.role}</div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
