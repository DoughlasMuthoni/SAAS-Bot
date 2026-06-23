import { useState, useRef } from 'react'

interface Props {
  onSend: (text: string) => void
  disabled: boolean
  brandColor: string
  dark?: boolean
}

export default function InputArea({ onSend, disabled, brandColor, dark = false }: Props) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const submit = () => {
    if (!text.trim() || disabled) return
    onSend(text.trim())
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 100) + 'px'
  }

  const canSend = !!text.trim() && !disabled

  return (
    <div style={{
      padding: '10px 12px',
      borderTop: `1px solid ${dark ? '#3f3f46' : '#e2e8f0'}`,
      background: dark ? '#0f0f12' : '#fafafa',
      display: 'flex',
      alignItems: 'flex-end',
      gap: 8,
    }}>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Type a message…"
        rows={1}
        style={{
          flex: 1,
          resize: 'none',
          border: `1.5px solid ${dark ? '#3f3f46' : '#e2e8f0'}`,
          borderRadius: 10,
          padding: '8px 11px',
          fontSize: 13.5,
          outline: 'none',
          fontFamily: 'inherit',
          lineHeight: 1.45,
          background: dark ? '#1c1c1f' : (disabled ? '#f8fafc' : '#fff'),
          color: dark ? '#f4f4f5' : '#1e293b',
          transition: 'border-color .15s',
          maxHeight: 100,
          overflow: 'auto',
        }}
        onFocus={e => (e.target.style.borderColor = brandColor)}
        onBlur={e => (e.target.style.borderColor = dark ? '#3f3f46' : '#e2e8f0')}
      />
      <button
        onClick={submit}
        disabled={!canSend}
        aria-label="Send message"
        style={{
          background: canSend ? brandColor : (dark ? '#27272a' : '#e2e8f0'),
          color: canSend ? '#fff' : (dark ? '#52525b' : '#94a3b8'),
          border: 'none',
          borderRadius: 10,
          width: 36, height: 36,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: canSend ? 'pointer' : 'not-allowed',
          flexShrink: 0,
          transition: 'background .15s, transform .1s',
        }}
        onMouseEnter={e => { if (canSend) (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
  )
}
