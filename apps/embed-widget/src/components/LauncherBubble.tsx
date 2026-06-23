import { useState } from 'react'

interface Props {
  onClick: () => void
  isOpen: boolean
  color: string
  position?: string
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
@keyframes chatbot-fadein {
  from { opacity: 0; transform: translateX(8px); }
  to   { opacity: 1; transform: translateX(0); }
}
`
}

export default function LauncherBubble({ onClick, isOpen, color, position = 'bottom-right' }: Props) {
  const [hovered, setHovered] = useState(false)
  const isLeft = position === 'bottom-left'

  return (
    <>
      <style>{buildKeyframes(color)}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: isLeft ? 'row-reverse' : 'row' }}>

        {/* "Ask me anything" label — hidden when chat is open */}
        {!isOpen && (
          <div style={{
            animation: 'chatbot-fadein 0.35s ease both',
            background: '#fff',
            color: '#1f2937',
            fontSize: 13,
            fontWeight: 500,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            padding: '7px 14px',
            borderRadius: 20,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            userSelect: 'none',
            border: '1px solid rgba(0,0,0,0.06)',
            transition: 'box-shadow 0.2s, transform 0.2s',
            transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
          }}
            onClick={onClick}
          >
            💬 Ask me anything
          </div>
        )}

        {/* Launcher bubble */}
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
