interface Citation {
  title?: string
  url?: string
  snippet?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
}

interface Props {
  message: Message
  brandColor: string
  dark?: boolean
}

export default function MessageBubble({ message, brandColor, dark = false }: Props) {
  const isUser = message.role === 'user'

  const assistantBg = dark ? '#27272a' : '#f1f5f9'
  const assistantText = dark ? '#f4f4f5' : '#1e293b'
  const citationBg = dark ? '#1e1e2e' : '#fff'
  const citationBorder = dark ? '#3f3f46' : '#e2e8f0'
  const citationText = dark ? '#a1a1aa' : '#475569'
  const citationTitle = dark ? '#e4e4e7' : '#334155'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      gap: 8,
      flexDirection: isUser ? 'row-reverse' : 'row',
    }}>
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${brandColor}cc, ${brandColor})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, boxShadow: '0 1px 4px rgba(0,0,0,.15)',
        }}>🤖</div>
      )}

      <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        <div style={{
          padding: '9px 13px',
          borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
          background: isUser ? brandColor : assistantBg,
          color: isUser ? '#fff' : assistantText,
          fontSize: 13.5,
          lineHeight: 1.55,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          boxShadow: isUser
            ? `0 2px 8px ${brandColor}44`
            : dark ? 'none' : '0 1px 4px rgba(0,0,0,.07)',
        }}>
          {message.content}
        </div>

        {!isUser && message.citations && message.citations.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            {message.citations.slice(0, 3).map((c, i) => (
              <a
                key={i}
                href={c.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 6,
                  background: citationBg,
                  border: `1px solid ${citationBorder}`,
                  borderLeft: `3px solid ${brandColor}`,
                  borderRadius: 6,
                  padding: '6px 8px',
                  textDecoration: 'none',
                  fontSize: 11.5,
                  color: citationText,
                  lineHeight: 1.4,
                  transition: 'background .15s',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = dark ? '#27272a' : '#f8fafc')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = citationBg)}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={brandColor} strokeWidth="2.5" strokeLinecap="round" style={{ marginTop: 1, flexShrink: 0 }}>
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                <div>
                  <div style={{ fontWeight: 600, color: citationTitle, marginBottom: 1 }}>{c.title || 'Source'}</div>
                  {c.snippet && (
                    <div style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {c.snippet}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
