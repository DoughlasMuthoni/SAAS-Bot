import { useEffect, useState } from 'react'
import ChatPanel from './components/ChatPanel'
import LauncherBubble from './components/LauncherBubble'
import { getWidgetConfig, createSession } from './api/widgetApi'
import { useChatStore } from './store/chatStore'

interface Props {
  botPublicKey: string
  apiBase?: string
}

// Launcher bubble height + its bottom margin + gap above panel
const LAUNCHER_CLEARANCE = 92 // 20 bottom + 62 bubble + 10 gap

export default function ChatWidget({ botPublicKey, apiBase = '' }: Props) {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { setConfig, setSessionToken, setPublicKey, setSessionError, config } = useChatStore()

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 480px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (!botPublicKey) {
      console.error('[ChatbotWidget] No bot public key provided')
      return
    }
    console.log('[ChatbotWidget] Fetching config for', botPublicKey, 'from', apiBase || window.location.origin)
    getWidgetConfig(botPublicKey, apiBase)
      .then((cfg) => {
        console.log('[ChatbotWidget] Config loaded', cfg)
        setConfig(cfg)
        setPublicKey(botPublicKey)
        const domain = window.location.origin
        const storageKey = `chatbot_${botPublicKey}_session`
        const cached = sessionStorage.getItem(storageKey)
        if (cached) {
          setSessionToken(cached)
        } else {
          createSession(botPublicKey, domain, apiBase)
            .then((res) => {
              setSessionToken(res.session_token)
              sessionStorage.setItem(storageKey, res.session_token)
            })
            .catch((err: any) => {
              console.error('[ChatbotWidget] Session creation failed', err)
              if (err?.status === 402 || err?.status === 403) {
                setSessionError(err.message || 'This chatbot is currently unavailable.')
              }
            })
        }
      })
      .catch((err) => console.error('[ChatbotWidget] Config fetch failed', err))
  }, [botPublicKey])

  if (!config) return null

  const side = config.position === 'bottom-left' ? 'left' : 'right'
  const edgeOffset = 20

  return (
    <>
      {/* Chat panel — anchored independently from launcher so it never overflows upward */}
      {open && !isMobile && (
        <div style={{
          position: 'fixed',
          bottom: LAUNCHER_CLEARANCE,
          [side]: edgeOffset,
          zIndex: 999998,
          width: `min(420px, calc(100vw - ${edgeOffset * 2}px))`,
        }}>
          <ChatPanel onClose={() => setOpen(false)} apiBase={apiBase} isMobile={false} />
        </div>
      )}

      {/* Mobile: panel is full-screen, launcher sits on top */}
      {open && isMobile && (
        <ChatPanel onClose={() => setOpen(false)} apiBase={apiBase} isMobile={true} />
      )}

      {/* Launcher bubble — hidden on mobile when chat is open (panel has its own close button) */}
      {(!isMobile || !open) && (
        <div style={{
          position: 'fixed',
          bottom: edgeOffset,
          [side]: edgeOffset,
          zIndex: 999999,
        }}>
          <LauncherBubble
            onClick={() => setOpen(!open)}
            isOpen={open}
            color={config.brand_color}
            position={config.position}
            botName={config.name}
          />
        </div>
      )}
    </>
  )
}
