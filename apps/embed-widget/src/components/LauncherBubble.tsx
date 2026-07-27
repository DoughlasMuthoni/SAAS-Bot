import { useState } from 'react'

interface Props {
  onClick: () => void
  isOpen: boolean
  color: string
  position?: string
  botName?: string
}

function buildKeyframes(color: string) {
  const hex = color.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return `
@keyframes chatbot-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(${r},${g},${b},0.45); }
  70%  { box-shadow: 0 0 0 10px rgba(${r},${g},${b},0); }
  100% { box-shadow: 0 0 0 0 rgba(${r},${g},${b},0); }
}
@keyframes cb-label-in {
  from { opacity: 0; transform: translateY(10px) scale(.94); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
`
}

export default function LauncherBubble({
  onClick,
  isOpen,
  color,
  position = 'bottom-right',
  botName = 'Support',
}: Props) {
  const [hovered, setHovered] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const isLeft = position === 'bottom-left'

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDismissed(true)
  }

  const showLabel = !isOpen && !dismissed

  return (
    <>
      <style>{buildKeyframes(color)}</style>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 10,
        flexDirection: isLeft ? 'row-reverse' : 'row',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>

        {/* Floating label card — dismissible, auto-hides after first open */}
        {showLabel && (
          <div
            onClick={onClick}
            style={{
              animation: 'cb-label-in 0.32s cubic-bezier(0.34,1.56,0.64,1) both',
              background: '#fff',
              borderRadius: 14,
              boxShadow: '0 6px 24px rgba(0,0,0,.14), 0 1px 4px rgba(0,0,0,.08)',
              border: '1px solid rgba(0,0,0,.07)',
              padding: '10px 12px',
              cursor: 'pointer',
              userSelect: 'none',
              maxWidth: 210,
              position: 'relative',
            }}
          >
            {/* Dismiss × */}
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              style={{
                position: 'absolute', top: 6, right: 7,
                background: 'none', border: 'none',
                cursor: 'pointer', padding: '2px 4px',
                fontSize: 11, lineHeight: 1,
                color: '#94a3b8',
                borderRadius: 4,
                transition: 'color .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#475569')}
              onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
            >✕</button>

            {/* Avatar + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 16 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${lighten(color, 20)}, ${color})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, boxShadow: `0 2px 8px ${color}44`,
              }}>🤖</div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                  {botName}
                </div>
                <div style={{
                  fontSize: 10.5, color: '#64748b',
                  display: 'flex', alignItems: 'center', gap: 3, marginTop: 1,
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: '#4ade80', display: 'inline-block',
                  }} />
                  Online now
                </div>
              </div>
            </div>

            {/* Prompt line */}
            <div style={{
              marginTop: 8,
              fontSize: 12.5,
              color: '#374151',
              lineHeight: 1.45,
              paddingLeft: 38,
            }}>
              How can I help you today? 👋
            </div>
          </div>
        )}

        {/* Main launcher bubble */}
        <button
          onClick={onClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
          style={{
            width: hovered ? 62 : 58,
            height: hovered ? 62 : 58,
            borderRadius: '50%',
            background: hovered
              ? `radial-gradient(circle at 35% 35%, ${lighten(color, 20)}, ${color})`
              : `radial-gradient(circle at 35% 35%, ${lighten(color, 10)}, ${color})`,
            border: 'none',
            cursor: 'pointer',
            boxShadow: hovered
              ? `0 8px 24px rgba(0,0,0,0.35), 0 0 0 4px ${color}33`
              : '0 4px 16px rgba(0,0,0,0.25)',
            animation: !isOpen ? `chatbot-pulse 2.4s ease-in-out 1.5s infinite` : 'none',
            fontSize: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
            outline: 'none',
            userSelect: 'none',
            flexShrink: 0,
          }}
        >
          <span style={{
            display: 'inline-block',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: isOpen ? 'rotate(90deg) scale(0.9)' : 'rotate(0deg) scale(1)',
            lineHeight: 1,
          }}>
            {isOpen ? '✕' : '💬'}
          </span>
        </button>

      </div>
    </>
  )
}

function lighten(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, (num >> 16) + amount)
  const g = Math.min(255, ((num >> 8) & 0xff) + amount)
  const b = Math.min(255, (num & 0xff) + amount)
  return `rgb(${r},${g},${b})`
}
