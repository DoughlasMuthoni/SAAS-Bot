import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  org_id: string
  is_superadmin: boolean
}

interface AuthState {
  user: User | null
  accessToken: string | null
  setToken: (token: string) => void
  setUser: (user: User) => void
  login: (email: string, password: string) => Promise<void>
  register: (fullName: string, email: string, password: string, orgName: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setToken: (token) => set({ accessToken: token }),
      setUser: (user) => set({ user }),
      login: async (email, password) => {
        const resp = await axios.post('/api/v1/auth/login', { email, password }, { withCredentials: true })
        const token = resp.data.access_token
        const me = await axios.get('/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        set({ accessToken: token, user: me.data })
      },
      register: async (fullName, email, password, orgName) => {
        const resp = await axios.post('/api/v1/auth/register', { full_name: fullName, email, password, org_name: orgName }, { withCredentials: true })
        const token = resp.data.access_token
        const me = await axios.get('/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        set({ accessToken: token, user: me.data })
      },
      logout: () => {
        axios.post('/api/v1/auth/logout', {}, { withCredentials: true }).catch(() => {})
        set({ user: null, accessToken: null })
      },
    }),
    { name: 'chatbot-auth', storage: { getItem: (k) => sessionStorage.getItem(k), setItem: (k, v) => sessionStorage.setItem(k, v), removeItem: (k) => sessionStorage.removeItem(k) } }
  )
)
