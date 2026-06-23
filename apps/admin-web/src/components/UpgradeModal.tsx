import { useNavigate } from 'react-router-dom'

interface Props {
  reason: string
  onClose: () => void
}

const WHAT_YOU_GET = [
  '3 chatbots',
  '15 knowledge sources',
  '5,000 conversations / month',
  'Web crawler ingestion',
  'Source citations in chat',
  'Custom branding & themes',
  '2 team members',
  'Email support',
]

export default function UpgradeModal({ reason, onClose }: Props) {
  const navigate = useNavigate()

  return (
    <div
      className="modal show d-block"
      style={{ background: 'rgba(0,0,0,.55)', zIndex: 1300 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-dialog" style={{ maxWidth: 480, marginTop: '10vh' }}>
        <div className="modal-content" style={{ borderRadius: 16, border: 'none', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #15803d 0%, #16a34a 60%, #1d4ed8 100%)',
            padding: '1.5rem 1.75rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(255,255,255,.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>
                🚀
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.05rem' }}>Plan limit reached</div>
                <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 13 }}>Upgrade to keep growing</div>
              </div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,.12)', borderRadius: 9,
              padding: '10px 14px', fontSize: 13.5, color: 'rgba(255,255,255,.9)',
              border: '1px solid rgba(255,255,255,.2)',
            }}>
              {reason}
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '1.5rem 1.75rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 10 }}>
                Pro plan — KES 6,000 / month
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {WHAT_YOU_GET.map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13.5, color: '#374151' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                style={{
                  background: '#16a34a', color: '#fff',
                  border: 'none', borderRadius: 10, padding: '12px',
                  fontWeight: 700, fontSize: 14.5, cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(22,163,74,.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                onClick={() => { onClose(); navigate('/billing') }}
              >
                View upgrade options →
              </button>
              <a
                href="mailto:info@douglasgithui.co.ke?subject=Upgrade%20to%20Pro"
                style={{
                  display: 'block', textAlign: 'center',
                  background: '#f0fdf4', color: '#16a34a',
                  border: '1px solid #bbf7d0', borderRadius: 10, padding: '11px',
                  fontWeight: 600, fontSize: 13.5, textDecoration: 'none',
                }}
              >
                Contact us to upgrade
              </a>
              <button
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer', padding: '4px' }}
                onClick={onClose}
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
