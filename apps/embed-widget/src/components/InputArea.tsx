import { useState, useRef, useEffect } from 'react'

interface Props {
  onSend: (text: string) => void
  disabled: boolean
  brandColor: string
  dark?: boolean
}

const MAX_CHARS = 2000

// 40 emojis in 8 columns = 5 rows — fits cleanly inside 260px picker
const EMOJIS = [
  '😀','😂','😊','😍','🤔','😎','😢','😡',
  '😅','🙂','😁','🥰','😇','🤩','😆','😤',
  '👍','👎','👏','🙏','👋','🤝','💪','❤️',
  '🔥','⭐','✅','❌','🎉','🎊','💡','🚀',
  '🌟','💥','🎯','🏆','🌈','🍀','💎','🤖',
]

export default function InputArea({ onSend, disabled, brandColor, dark = false }: Props) {
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiWrapRef = useRef<HTMLDivElement>(null)

  // Close picker on outside click — Shadow DOM-safe via composedPath
  useEffect(() => {
    if (!showEmoji) return
    const tid = setTimeout(() => {
      const handler = (e: MouseEvent) => {
        const path: EventTarget[] = e.composedPath ? e.composedPath() : (e.target ? [e.target] : [])
        if (emojiWrapRef.current && !path.includes(emojiWrapRef.current)) {
          setShowEmoji(false)
        }
      }
      const root = emojiWrapRef.current?.getRootNode() ?? document
      root.addEventListener('mousedown', handler as EventListener)
      return () => root.removeEventListener('mousedown', handler as EventListener)
    }, 0)
    return () => clearTimeout(tid)
  }, [showEmoji])

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current
    if (!el) { setText(t => (t + emoji).slice(0, MAX_CHARS)); return }
    const start = el.selectionStart ?? text.length
    const end   = el.selectionEnd   ?? text.length
    const next  = (text.slice(0, start) + emoji + text.slice(end)).slice(0, MAX_CHARS)
    setText(next)
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + emoji.length
      el.focus()
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
    if (e.key === 'Escape') setShowEmoji(false)
  }

  const submit = () => {
    if (!text.trim() || disabled) return
    onSend(text.trim())
    setText('')
    setShowEmoji(false)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, MAX_CHARS)
    setText(val)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 110) + 'px'
  }

  const canSend   = !!text.trim() && !disabled
  const nearLimit = text.length > MAX_CHARS * 0.85
  const borderColor = focused ? brandColor : (dark ? '#3f3f46' : '#e2e8f0')
  const pickerBg    = dark ? '#1c1c1f' : '#ffffff'
  const pickerBorder = dark ? '#3f3f46' : '#e2e8f0'

  return (
    <div style={{ padding: '10px 12px', borderTop: `1px solid ${dark ? '#27272a' : '#eaecef'}`, background: dark ? '#18181b' : '#fff' }}>

      {/* Input row */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 6,
        background: dark ? '#27272a' : '#F6F6F7',
        borderRadius: 14,
        border: `1.5px solid ${borderColor}`,
        padding: '5px 6px 5px 12px',
        transition: 'border-color .15s',
      }}>

        {/* Textarea — fills remaining space */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          placeholder={disabled ? 'Thinking…' : 'Ask a question…'}
          rows={1}
          style={{
            flex: 1, resize: 'none', border: 'none', outline: 'none',
            background: 'transparent',
            fontSize: 13.5, fontFamily: 'inherit', lineHeight: 1.5,
            color: dark ? '#f4f4f5' : '#1e293b',
            maxHeight: 110, overflow: 'auto', padding: '5px 0',
          }}
        />

        {/* Right-side controls: emoji toggle + send */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>

          {/* Emoji button + floating picker */}
          <div ref={emojiWrapRef} style={{ position: 'relative' }}>
            <button
              onMouseDown={e => { e.preventDefault(); setShowEmoji(v => !v) }}
              aria-label="Emoji picker"
              title="Add emoji"
              style={{
                background: showEmoji ? (dark ? '#3f3f46' : '#f1f5f9') : 'none',
                border: 'none', cursor: 'pointer',
                fontSize: 19, padding: '4px 5px', lineHeight: 1,
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, marginBottom: 1,
                opacity: showEmoji ? 1 : 0.55,
                transition: 'opacity .15s, background .15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = showEmoji ? '1' : '0.55'}
            >😊</button>

            {showEmoji && (
              <div style={{
                position: 'absolute',
                bottom: 'calc(100% + 10px)',
                right: 0,           // anchored to right edge of the button
                width: 262,
                background: pickerBg,
                border: `1px solid ${pickerBorder}`,
                borderRadius: 12,
                boxShadow: dark
                  ? '0 8px 32px rgba(0,0,0,.6)'
                  : '0 8px 32px rgba(0,0,0,.14)',
                padding: '10px 8px 8px',
                zIndex: 20,
              }}>
                {/* Downward arrow — right-aligned to match button */}
                <div style={{
                  position: 'absolute', bottom: -7, right: 10,
                  width: 12, height: 12,
                  background: pickerBg,
                  border: `1px solid ${pickerBorder}`,
                  borderTop: 'none', borderLeft: 'none',
                  transform: 'rotate(45deg)',
                }} />

                <div style={{ fontSize: 10, color: dark ? '#52525b' : '#94a3b8', marginBottom: 6, paddingLeft: 2, letterSpacing: '.05em', textTransform: 'uppercase' }}>
                  Emoji
                </div>

                {/* 8-column grid — each cell ≈ 30px, no overflow */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2 }}>
                  {EMOJIS.map(em => (
                    <button
                      key={em}
                      onMouseDown={e => { e.preventDefault(); insertEmoji(em) }}
                      title={em}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 20, padding: '5px 0', borderRadius: 7,
                        lineHeight: 1, textAlign: 'center',
                        transition: 'background .1s, transform .1s',
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.background = dark ? '#27272a' : '#f1f5f9'
                        el.style.transform = 'scale(1.28)'
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.background = 'none'
                        el.style.transform = 'scale(1)'
                      }}
                    >{em}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Send button */}
          <button
            onClick={submit}
            disabled={!canSend}
            aria-label="Send message"
            style={{
              background: canSend
                ? `linear-gradient(135deg, ${brandColor}dd, ${brandColor})`
                : (dark ? '#3f3f46' : '#e2e8f0'),
              color: canSend ? '#fff' : (dark ? '#52525b' : '#94a3b8'),
              border: 'none', borderRadius: 10,
              width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: canSend ? 'pointer' : 'not-allowed',
              flexShrink: 0,
              transition: 'background .15s, transform .1s, box-shadow .15s',
              boxShadow: canSend ? `0 2px 8px ${brandColor}44` : 'none',
            }}
            onMouseEnter={e => { if (canSend) (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
            onMouseDown={e => { if (canSend) (e.currentTarget as HTMLElement).style.transform = 'scale(.95)' }}
            onMouseUp={e => { if (canSend) (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)' }}
          >
            {disabled ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, padding: '0 2px' }}>
        <span style={{ fontSize: 10.5, color: dark ? '#3f3f46' : '#c0c4cc' }}>
          Enter to send · Shift+Enter for new line
        </span>
        {nearLimit && (
          <span style={{
            fontSize: 10.5, fontVariantNumeric: 'tabular-nums',
            color: text.length >= MAX_CHARS ? '#dc2626' : (dark ? '#71717a' : '#94a3b8'),
          }}>
            {text.length}/{MAX_CHARS}
          </span>
        )}
      </div>
    </div>
  )
}
