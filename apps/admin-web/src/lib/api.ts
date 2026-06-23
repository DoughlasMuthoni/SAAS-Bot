import axios from 'axios'
import { useAuthStore } from './auth'
import { useUpgradeStore } from './upgradeStore'

const api = axios.create({ baseURL: '/api/v1', withCredentials: true })

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const refreshResp = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true })
        useAuthStore.getState().setToken(refreshResp.data.access_token)
        error.config.headers.Authorization = `Bearer ${refreshResp.data.access_token}`
        return axios(error.config)
      } catch {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }
    if (error.response?.status === 402) {
      const reason = error.response.data?.detail || 'You have reached a limit on your current plan.'
      useUpgradeStore.getState().show(reason)
    }
    return Promise.reject(error)
  }
)

export default api
