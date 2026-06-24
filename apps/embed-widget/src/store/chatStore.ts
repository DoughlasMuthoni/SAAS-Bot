import { create } from 'zustand'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: any[]
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
  streaming: boolean
  showLeadForm: boolean
  addMessage: (msg: Message) => void
  updateLastAssistantMessage: (content: string, citations?: any[]) => void
  setSessionToken: (token: string) => void
  setConfig: (config: WidgetConfig) => void
  setStreaming: (v: boolean) => void
  setShowLeadForm: (v: boolean) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  sessionToken: null,
  sessionId: null,
  config: null,
  streaming: false,
  showLeadForm: false,
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateLastAssistantMessage: (content, citations) =>
    set((s) => {
      const msgs = [...s.messages]
      const last = msgs.map((m: Message) => m.role).lastIndexOf('assistant')
      if (last >= 0) {
        msgs[last] = { ...msgs[last], content, citations: citations ?? msgs[last].citations }
      }
      return { messages: msgs }
    }),
  setSessionToken: (token) => set({ sessionToken: token }),
  setConfig: (config) => set({ config }),
  setStreaming: (v) => set({ streaming: v }),
  setShowLeadForm: (v) => set({ showLeadForm: v }),
}))
