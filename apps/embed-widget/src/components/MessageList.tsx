import { useEffect, useRef } from 'react'
import { useChatStore } from '../store/chatStore'
import MessageBubble from './MessageBubble'

interface Props {
  dark?: boolean
}

export default function MessageList({ dark = false }: Props) {
  const { messages, config, streaming } = useChatStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  const showTyping =
    streaming &&
    messages[messages.length - 1]?.role === 'assistant' &&
    messages[messages.length - 1]?.content === ''

  const brandColor = config?.brand_color || '#6366f1'

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '14px 14px 6px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      background: dark ? '#18181b' : '#fff',
      scrollbarWidth: 'thin',
      scrollbarColor: dark ? '#3f3f46 transparent' : '#cbd5e1 transparent',
    }}>
      <style>{`
        @keyframes cb-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: .4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>

      {messages.length === 0 && config && (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          flex: 1, gap: 10,
          textAlign: 'center', padding: '0 20px',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: `${brandColor}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>💬</div>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: dark ? '#a1a1aa' : '#64748b' }}>
            {config.welcome_message}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: dark ? '#71717a' : '#94a3b8' }}>
            Ask me anything — I'm here to help!
          </p>
        </div>
      )}

      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} brandColor={brandColor} dark={dark} />
      ))}

      {showTyping && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${brandColor}cc, ${brandColor})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13,
          }}>🤖</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: dark ? '#27272a' : '#f1f5f9',
            borderRadius: '14px 14px 14px 2px',
            padding: '11px 14px',
            boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,.07)',
          }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: dark ? '#71717a' : '#94a3b8',
                animation: `cb-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
