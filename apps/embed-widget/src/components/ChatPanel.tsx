import { useChatStore } from '../store/chatStore'
import MessageList from './MessageList'
import InputArea from './InputArea'
import LeadCaptureForm from './LeadCaptureForm'
import { sendMessage } from '../api/widgetApi'

interface Props {
  onClose: () => void
  apiBase: string
  isMobile: boolean
}

export default function ChatPanel({ onClose, apiBase, isMobile }: Props) {
  const {
    config, sessionToken, messages,
    addMessage, updateLastAssistantMessage,
    setStreaming, streaming, showLeadForm, setShowLeadForm,
  } = useChatStore()

  const dark = config?.theme === 'dark'

  const handleSend = async (text: string) => {
    if (!sessionToken || streaming) return
    const userMsg = { id: crypto.randomUUID(), role: 'user' as const, content: text }
    addMessage(userMsg)
    setStreaming(true)

    const assistantMsg = { id: crypto.randomUUID(), role: 'assistant' as const, content: '' }
    addMessage(assistantMsg)

    const history = messages.slice(-20).map((m) => ({ role: m.role, content: m.content }))

    try {
      const reader = await sendMessage(sessionToken, text, history, apiBase)
      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''

      const cleanForDisplay = (t: string) =>
        t.split('[REQUEST_CONTACT]')[0].replace(/\n?📄[^\n]*/g, '').trimEnd()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const evt = JSON.parse(line.slice(6))
            if (evt.type === 'token') {
              fullContent += evt.data
              updateLastAssistantMessage(cleanForDisplay(fullContent))
            } else if (evt.type === 'correct') {
              fullContent = evt.data
              updateLastAssistantMessage(fullContent)
            } else if (evt.type === 'metadata') {
              updateLastAssistantMessage(cleanForDisplay(fullContent), evt.data.citations)
              if (evt.data.unresolved || evt.data.show_lead_form) setShowLeadForm(true)
            }
          } catch {}
        }
      }
    } finally {
      setStreaming(false)
    }
  }

  if (!config) return null

  const panelStyle: React.CSSProperties = isMobile
    ? { position: 'fixed', inset: 0, borderRadius: 0, width: '100%', height: '100%' }
    : { width: 420, height: 'min(1120px, calc(100vh - 110px))', borderRadius: 16 }

  return (
    <div style={{
      ...panelStyle,
      background: dark ? '#18181b' : '#fff',
      boxShadow: '0 12px 40px rgba(0,0,0,.28), 0 2px 8px rgba(0,0,0,.14)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      animation: 'cb-slide-up .22s cubic-bezier(.34,1.56,.64,1)',
    }}>
      <style>{`
        @keyframes cb-slide-up {
          from { opacity: 0; transform: translateY(12px) scale(.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${lighten(config.brand_color, 10)}, ${config.brand_color})`,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17, flexShrink: 0,
        }}>🤖</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>{config.name}</div>
          <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 11, marginTop: 1 }}>
            <span style={{
              display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
              background: '#4ade80', marginRight: 4, verticalAlign: 'middle',
            }} />
            Online
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close chat"
          style={{
            background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', cursor: 'pointer',
            width: 30, height: 30, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, transition: 'background .15s', flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.25)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.15)')}
        >✕</button>
      </div>

      <MessageList dark={dark} />
      {showLeadForm && <LeadCaptureForm apiBase={apiBase} dark={dark} />}
      <InputArea onSend={handleSend} disabled={streaming} brandColor={config.brand_color} dark={dark} />
    </div>
  )
}

function lighten(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, (num >> 16) + amount)
  const g = Math.min(255, ((num >> 8) & 0xff) + amount)
  const b = Math.min(255, (num & 0xff) + amount)
  return `rgb(${r},${g},${b})`
}
