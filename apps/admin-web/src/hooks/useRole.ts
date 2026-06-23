import { useAuthStore } from '../lib/auth'

const RANK: Record<string, number> = { owner: 4, admin: 3, editor: 2, viewer: 1 }

export function useRole() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'viewer'
  const rank = RANK[role] ?? 1
  return {
    role,
    isOwner:  role === 'owner',
    isAdmin:  rank >= 3,  // owner or admin — can manage team, billing, create/delete bots
    canEdit:  rank >= 2,  // owner, admin, editor — can create/edit content, change statuses
    isViewer: rank < 2,   // viewer — read-only
  }
}
