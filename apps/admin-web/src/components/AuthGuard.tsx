import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../lib/auth'
import api from '../lib/api'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { accessToken, user, setUser } = useAuthStore()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!accessToken) { setChecked(true); return }
    // Re-fetch /auth/me on every app load so fields like is_superadmin stay current
    api.get('/auth/me')
      .then(r => { setUser(r.data); setChecked(true) })
      .catch(() => setChecked(true))
  }, [accessToken])  // eslint-disable-line react-hooks/exhaustive-deps

  if (!accessToken) return <Navigate to="/login" replace />
  if (!checked) return null   // wait for the me-fetch before rendering
  return <>{children}</>
}
