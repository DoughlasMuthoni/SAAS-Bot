import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuthStore } from '../lib/auth'
import { useWorkspaceStore } from '../lib/workspace'

export function useWorkspaceInit() {
  const token = useAuthStore((s) => s.accessToken)
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces)

  const { data } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => api.get('/workspaces').then((r) => r.data),
    enabled: !!token,
  })

  useEffect(() => {
    if (data) setWorkspaces(data)
  }, [data, setWorkspaces])
}
