import { create } from 'zustand'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface WidgetConfig {
  bot_id: string
  name: string
  brand_color: string
  welcome_message: string
  position: string
  theme: string
  show_branding: boolean
}

interface ChatState {
  messages: Message[]
  sessionToken: string | null
  sessionId: string | null
  config: WidgetConfig | null
  publicKey: string | null
  streaming: boolean
  showLeadForm: boolean
  sessionError: string | null
  addMessage: (msg: Message) => void
  updateLastAssistantMessage: (content: string) => void
  setSessionToken: (token: string) => void
  setConfig: (config: WidgetConfig) => void
  setPublicKey: (key: string) => void
  setStreaming: (v: boolean) => void
  setShowLeadForm: (v: boolean) => void
  setSessionError: (msg: string | null) => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  sessionToken: null,
  sessionId: null,
  config: null,
  publicKey: null,
  streaming: false,
  showLeadForm: false,
  sessionError: null,
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateLastAssistantMessage: (content) =>
    set((s) => {
      const msgs = [...s.messages]
      const last = msgs.map((m: Message) => m.role).lastIndexOf('assistant')
      if (last >= 0) {
        msgs[last] = { ...msgs[last], content }
      }
      return { messages: msgs }
    }),
  setSessionToken: (token) => set({ sessionToken: token }),
  setConfig: (config) => set({ config }),
  setPublicKey: (key) => set({ publicKey: key }),
  setStreaming: (v) => set({ streaming: v }),
  setShowLeadForm: (v) => set({ showLeadForm: v }),
  setSessionError: (msg) => set({ sessionError: msg }),
}))
