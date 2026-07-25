import { useEffect, useRef } from 'react'
import { useChatStore } from '../store/chatStore'
import MessageBubble from './MessageBubble'

interface Props {
  dark?: boolean
  onSend?: (text: string) => void
}

export default function MessageList({ dark = false, onSend }: Props) {
  const { messages, config, streaming, sessionError } = useChatStore()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, streaming])

  const lastMsg = messages[messages.length - 1]
  const showTyping =
    streaming &&
    lastMsg?.role === 'assistant' &&
    lastMsg?.content === ''

  const brandColor = config?.brand_color || '#16A34A'

  const msgBg  = dark ? '#1c1c1f' : '#EBEBED'
  const textMuted = dark ? '#71717a' : '#94a3b8'

  return (
    <div ref={containerRef} style={{
      flex: 1,
      overflowY: 'auto',
      padding: '16px 14px 8px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      background: dark ? '#18181b' : '#F6F6F7',
      scrollbarWidth: 'thin',
      scrollbarColor: dark ? '#3f3f46 transparent' : '#e2e8f0 transparent',
    }}>
      <style>{`
        @keyframes cb-wave {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes cb-pulse-dot {
          0%, 100% { opacity: .35; transform: scale(.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>

      {/* Trial expired / service unavailable notice */}
      {sessionError && (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          flex: 1, gap: 14, textAlign: 'center', padding: '0 24px',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: '#fef2f2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26,
          }}>🔒</div>
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: dark ? '#f87171' : '#dc2626', lineHeight: 1.45 }}>
              Service Unavailable
            </p>
            <p style={{ margin: 0, fontSize: 12.5, color: textMuted, lineHeight: 1.6 }}>
              {sessionError}
            </p>
          </div>
        </div>
      )}

      {/* Empty / welcome state */}
      {!sessionError && messages.length === 0 && config && (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          flex: 1, gap: 14, textAlign: 'center', padding: '0 24px',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: `linear-gradient(135deg, ${brandColor}22, ${brandColor}44)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, boxShadow: `0 0 0 8px ${brandColor}11`,
          }}>💬</div>

          <div>
            <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: dark ? '#e4e4e7' : '#1e293b', lineHeight: 1.45 }}>
              {config.welcome_message}
            </p>
            <p style={{ margin: 0, fontSize: 12.5, color: textMuted, lineHeight: 1.5 }}>
              Ask <strong style={{ color: dark ? '#d4d4d8' : '#475569' }}>{config.name}</strong> anything — I'll answer from our knowledge base.
            </p>
          </div>

          {/* Suggested prompt chips — clicking sends the question */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center', marginTop: 4 }}>
            {['How does this work?', 'What can you help with?', 'Contact support'].map(q => (
              <button
                key={q}
                onClick={() => onSend?.(q)}
                style={{
                  background: msgBg,
                  border: `1px solid ${dark ? '#3f3f46' : '#e2e8f0'}`,
                  borderRadius: 20, padding: '6px 13px',
                  fontSize: 12, color: dark ? '#a1a1aa' : '#64748b',
                  cursor: onSend ? 'pointer' : 'default',
                  fontFamily: 'inherit',
                  transition: 'background .15s, border-color .15s, color .15s, transform .1s',
                }}
                onMouseEnter={e => {
                  if (!onSend) return
                  const el = e.currentTarget
                  el.style.background = dark ? '#3f3f46' : '#fff'
                  el.style.borderColor = brandColor
                  el.style.color = brandColor
                  el.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.background = msgBg
                  el.style.borderColor = dark ? '#3f3f46' : '#e2e8f0'
                  el.style.color = dark ? '#a1a1aa' : '#64748b'
                  el.style.transform = 'translateY(0)'
                }}
              >{q}</button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.map((msg, idx) => {
        const isLastAssistant =
          msg.role === 'assistant' &&
          idx === messages.length - 1 &&
          streaming &&
          msg.content !== ''
        return (
          <MessageBubble
            key={msg.id}
            message={msg}
            brandColor={brandColor}
            dark={dark}
            isStreaming={isLastAssistant}
          />
        )
      })}

      {/* Typing indicator — only shown before first token arrives */}
      {showTyping && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${brandColor}cc, ${brandColor})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13,
          }}>🤖</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: dark ? '#27272a' : '#f1f5f9',
            borderRadius: '16px 16px 16px 2px',
            padding: '12px 16px',
            boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,.07)',
          }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                width: 7, height: 7, borderRadius: '50%',
                background: dark ? '#52525b' : brandColor,
                opacity: 0.5,
                animation: `cb-wave 1.1s ease-in-out ${i * 0.18}s infinite`,
              }} />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
