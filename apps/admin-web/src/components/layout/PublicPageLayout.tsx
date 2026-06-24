import { Link, NavLink } from 'react-router-dom'

const LEGAL_NAV = [
  {
    to: '/privacy',
    label: 'Privacy Policy',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    to: '/terms',
    label: 'Terms of Service',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    to: '/security',
    label: 'Security',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2"/>
        <path d="M7 11V7a5 5 0 0110 0v4"/>
      </svg>
    ),
  },
]

interface Props {
  children: React.ReactNode
}

export default function PublicPageLayout({ children }: Props) {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>

      {/* ── Sticky header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 8px rgba(0,0,0,.06)',
      }}>
        <div style={{
          maxWidth: 1040, margin: '0 auto',
          padding: '0 24px', height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>

          {/* Logo */}
          <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <img src="/logo.jpeg" alt="DG ChatBot" style={{ height: 32, width: 'auto', objectFit: 'contain', borderRadius: 6 }} />
            <span style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', letterSpacing: '-.01em' }}>DG ChatBot</span>
          </Link>

          {/* Legal nav — hidden on very small screens */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            {LEGAL_NAV.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 13, fontWeight: 600, padding: '6px 13px', borderRadius: 8,
                  textDecoration: 'none',
                  color: isActive ? '#4f46e5' : '#374151',
                  background: isActive ? '#eef2ff' : 'transparent',
                  transition: 'all .15s',
                })}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Sign in */}
          <Link
            to="/login"
            style={{
              flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 700, color: '#4f46e5', textDecoration: 'none',
              padding: '7px 16px', borderRadius: 9,
              border: '1.5px solid #c7d2fe',
              background: '#eef2ff',
              transition: 'all .15s',
            }}
          >
            Sign in
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </header>

      {/* ── Page content ── */}
      <main style={{ flex: 1 }}>
        {children}
      </main>

      {/* ── Footer ── */}
      <footer style={{ background: '#fff', borderTop: '1px solid #e2e8f0', marginTop: 40 }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 24px 24px' }}>

          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', marginBottom: 28 }}>

            {/* Brand block */}
            <div style={{ maxWidth: 280 }}>
              <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 10 }}>
                <img src="/logo.jpeg" alt="DG ChatBot" style={{ height: 28, width: 'auto', objectFit: 'contain', borderRadius: 5 }} />
                <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>DG ChatBot</span>
              </Link>
              <p style={{ fontSize: 12.5, color: '#64748b', margin: 0, lineHeight: 1.65 }}>
                Multi-tenant AI chatbot platform. Embed a smart, grounded chatbot on any website in minutes.
              </p>
            </div>

            {/* Legal links */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
                Legal
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {LEGAL_NAV.map(item => (
                  <Link
                    key={item.to}
                    to={item.to}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#374151', textDecoration: 'none', fontWeight: 500 }}
                  >
                    <span style={{ color: '#94a3b8' }}>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
                Contact
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="mailto:info@douglasgithui.co.ke" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#374151', textDecoration: 'none', fontWeight: 500 }}>
                  <span style={{ color: '#94a3b8' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <path d="M22 6l-10 7L2 6"/>
                    </svg>
                  </span>
                  info@douglasgithui.co.ke
                </a>
                <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#374151', textDecoration: 'none', fontWeight: 500 }}>
                  <span style={{ color: '#94a3b8' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </span>
                  Admin Sign In
                </Link>
              </div>
            </div>
          </div>

          {/* Divider + copyright */}
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
              © {new Date().getFullYear()} Douglas Githui Creatives. All rights reserved.
            </p>
            <div style={{ display: 'flex', gap: 16 }}>
              {LEGAL_NAV.map(item => (
                <Link key={item.to} to={item.to} style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'none', fontWeight: 500 }}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
