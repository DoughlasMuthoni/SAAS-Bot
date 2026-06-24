import React from 'react'

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
  timestamp?: string
}

interface Props {
  message: Message
  brandColor: string
  dark?: boolean
  isStreaming?: boolean
}

// ── Inline markdown parser ────────────────────────────────────────
function parseInline(
  text: string,
  brandColor: string,
  dark: boolean,
  codeBg: string,
  codeColor: string,
  isUser: boolean,
): React.ReactNode[] {
  const regex = /\*\*(.*?)\*\*|\*(.*?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g
  const result: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null

  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) result.push(text.slice(last, m.index))

    if (m[1] !== undefined) {
      result.push(<strong key={m.index} style={{ fontWeight: 700 }}>{m[1]}</strong>)
    } else if (m[2] !== undefined) {
      result.push(<em key={m.index}>{m[2]}</em>)
    } else if (m[3] !== undefined) {
      result.push(
        <code key={m.index} style={{
          fontFamily: 'ui-monospace, Menlo, "Courier New", monospace',
          background: codeBg, color: codeColor,
          padding: '1px 5px', borderRadius: 4, fontSize: '90%',
        }}>{m[3]}</code>
      )
    } else if (m[4] !== undefined) {
      result.push(
        <a key={m.index} href={m[5]} target="_blank" rel="noopener noreferrer"
          style={{ color: isUser ? 'rgba(255,255,255,.9)' : (dark ? '#60a5fa' : brandColor), textDecoration: 'underline', textDecorationThickness: '1px' }}>
          {m[4]}
        </a>
      )
    }
    last = m.index + m[0].length
  }

  if (last < text.length) result.push(text.slice(last))
  return result.length ? result : [text]
}

// ── Block markdown renderer ───────────────────────────────────────
function renderMarkdown(
  text: string,
  brandColor: string,
  dark: boolean,
  isUser: boolean,
  isStreaming: boolean,
): React.ReactNode {
  const codeBg    = dark ? '#3f3f46' : '#e2e8f0'
  const codeColor = dark ? '#e4e4e7' : '#0f172a'
  const blockCodeBg = dark ? '#0d0d0f' : '#1e293b'
  const headingColor = isUser ? '#fff' : (dark ? '#f4f4f5' : '#0f172a')
  const mutedColor   = isUser ? 'rgba(255,255,255,.7)' : (dark ? '#71717a' : '#64748b')

  // Split off fenced code blocks first
  const segments = text.split(/(```[\w]*\n?[\s\S]*?```|```[\w]*\n?[\s\S]*$)/g)
  const nodes: React.ReactNode[] = []

  segments.forEach((seg, si) => {
    if (seg.startsWith('```')) {
      const lang = seg.match(/^```(\w*)/)?.[1] || ''
      const code = seg.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '')
      nodes.push(
        <div key={`code-${si}`} style={{
          background: blockCodeBg, borderRadius: 8, margin: '6px 0',
          overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,.3)',
        }}>
          {lang && (
            <div style={{ padding: '4px 12px', background: 'rgba(255,255,255,.05)', fontSize: 10.5, color: '#64748b', letterSpacing: '.05em', fontFamily: 'monospace' }}>
              {lang}
            </div>
          )}
          <pre style={{ margin: 0, padding: '10px 12px', overflowX: 'auto' }}>
            <code style={{ fontFamily: 'ui-monospace, Menlo, "Courier New", monospace', fontSize: 12.5, color: '#4ade80', whiteSpace: 'pre' }}>
              {code}
            </code>
          </pre>
        </div>
      )
      return
    }

    // Split into paragraphs
    const paras = seg.split(/\n\n+/)
    paras.forEach((para, pi) => {
      const trimmed = para.trim()
      if (!trimmed) return

      // Heading
      const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)/)
      if (headingMatch) {
        const level = headingMatch[1].length
        const sizes = [17, 15, 13.5]
        const margins = ['8px 0 4px', '6px 0 3px', '4px 0 2px']
        nodes.push(
          <div key={`h${level}-${si}-${pi}`} style={{
            fontWeight: 700, fontSize: sizes[level - 1],
            margin: margins[level - 1], color: headingColor, lineHeight: 1.3,
          }}>
            {parseInline(headingMatch[2], brandColor, dark, codeBg, codeColor, isUser)}
          </div>
        )
        return
      }

      // Horizontal rule
      if (/^[-*_]{3,}$/.test(trimmed.replace(/\s/g, ''))) {
        nodes.push(<div key={`hr-${si}-${pi}`} style={{ borderTop: `1px solid ${dark ? '#3f3f46' : '#e2e8f0'}`, margin: '8px 0' }} />)
        return
      }

      // List (unordered or ordered) — contiguous lines
      const lines = trimmed.split('\n')
      const isList = lines.every(l => /^[-*•]\s/.test(l.trim()) || /^\d+\.\s/.test(l.trim()))
      if (isList) {
        const ordered = /^\d+\.\s/.test(lines[0].trim())
        nodes.push(
          <div key={`list-${si}-${pi}`} style={{ margin: '4px 0', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {lines.map((line, li) => {
              const content = line.trim().replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '')
              return (
                <div key={li} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                  <span style={{
                    flexShrink: 0, minWidth: 14, marginTop: 1,
                    fontWeight: ordered ? 700 : 400,
                    color: isUser ? 'rgba(255,255,255,.85)' : brandColor,
                    fontSize: ordered ? 13 : 16, lineHeight: 1.3,
                  }}>
                    {ordered ? `${li + 1}.` : '•'}
                  </span>
                  <span>{parseInline(content, brandColor, dark, codeBg, codeColor, isUser)}</span>
                </div>
              )
            })}
          </div>
        )
        return
      }

      // Mixed paragraph (some list, some not) — render line by line
      const hasSomeLists = lines.some(l => /^[-*•]\s/.test(l.trim()) || /^\d+\.\s/.test(l.trim()))
      if (hasSomeLists) {
        nodes.push(
          <div key={`mixed-${si}-${pi}`} style={{ margin: pi > 0 ? '5px 0 0' : '0', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {lines.map((line, li) => {
              const t = line.trim()
              if (!t) return null
              const isBullet = /^[-*•]\s/.test(t)
              const isNum = /^\d+\.\s/.test(t)
              if (isBullet || isNum) {
                const content = t.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '')
                return (
                  <div key={li} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0, minWidth: 14, marginTop: 1, color: isUser ? 'rgba(255,255,255,.85)' : brandColor, fontSize: isNum ? 13 : 16, lineHeight: 1.3, fontWeight: isNum ? 700 : 400 }}>
                      {isNum ? `${li + 1}.` : '•'}
                    </span>
                    <span>{parseInline(content, brandColor, dark, codeBg, codeColor, isUser)}</span>
                  </div>
                )
              }
              return <div key={li}>{parseInline(t, brandColor, dark, codeBg, codeColor, isUser)}</div>
            })}
          </div>
        )
        return
      }

      // Blockquote
      if (lines.every(l => l.trim().startsWith('>'))) {
        const content = lines.map(l => l.trim().replace(/^>\s*/, '')).join('\n')
        nodes.push(
          <div key={`bq-${si}-${pi}`} style={{
            borderLeft: `3px solid ${isUser ? 'rgba(255,255,255,.4)' : brandColor}`,
            paddingLeft: 10, margin: '4px 0',
            color: mutedColor, fontStyle: 'italic',
          }}>
            {parseInline(content, brandColor, dark, codeBg, codeColor, isUser)}
          </div>
        )
        return
      }

      // Regular paragraph — handle soft line breaks
      nodes.push(
        <div key={`p-${si}-${pi}`} style={{ margin: pi > 0 ? '5px 0 0' : '0' }}>
          {lines.map((line, li) => (
            <React.Fragment key={li}>
              {li > 0 && <br />}
              {parseInline(line, brandColor, dark, codeBg, codeColor, isUser)}
            </React.Fragment>
          ))}
        </div>
      )
    })
  })

  // Blinking cursor while streaming
  if (isStreaming) {
    nodes.push(
      <span key="cursor" style={{
        display: 'inline-block',
        width: 2, height: '1em',
        background: isUser ? 'rgba(255,255,255,.9)' : (dark ? '#a1a1aa' : '#64748b'),
        borderRadius: 1,
        marginLeft: 2,
        verticalAlign: 'text-bottom',
        animation: 'cb-blink .7s step-end infinite',
      }} />
    )
  }

  return <>{nodes}</>
}

// ── Component ─────────────────────────────────────────────────────
export default function MessageBubble({ message, brandColor, dark = false, isStreaming = false }: Props) {
  const isUser = message.role === 'user'

  const assistantBg   = dark ? '#27272a' : '#f1f5f9'
  const assistantText = dark ? '#f4f4f5' : '#1e293b'

  return (
    <>
      <style>{`
        @keyframes cb-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes cb-msg-in {
          from { opacity: 0; transform: translateY(8px) scale(.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 8,
        flexDirection: isUser ? 'row-reverse' : 'row',
        animation: 'cb-msg-in .2s ease-out',
      }}>
        {!isUser && (
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${brandColor}cc, ${brandColor})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, boxShadow: '0 1px 4px rgba(0,0,0,.2)',
          }}>🤖</div>
        )}

        <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: 5, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
          <div style={{
            padding: isUser ? '9px 13px' : '10px 13px',
            borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
            background: isUser ? `linear-gradient(135deg, ${brandColor}dd, ${brandColor})` : assistantBg,
            color: isUser ? '#fff' : assistantText,
            fontSize: 13.5,
            lineHeight: 1.6,
            wordBreak: 'break-word',
            boxShadow: isUser
              ? `0 2px 10px ${brandColor}55`
              : dark ? 'none' : '0 1px 4px rgba(0,0,0,.07)',
          }}>
            {isUser
              ? <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
              : renderMarkdown(message.content, brandColor, dark, isUser, isStreaming)
            }
          </div>

          {/* Timestamp */}
          {message.timestamp && (
            <div style={{
              fontSize: 10,
              color: isUser ? 'rgba(255,255,255,.55)' : (dark ? '#52525b' : '#a0aec0'),
              marginTop: 3,
              paddingLeft: isUser ? 0 : 2,
              alignSelf: isUser ? 'flex-end' : 'flex-start',
            }}>
              {message.timestamp}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
