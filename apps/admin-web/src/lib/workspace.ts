import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Workspace {
  id: string
  org_id: string
  name: string
  slug: string
}

interface WorkspaceState {
  workspaces: Workspace[]
  activeWorkspaceId: string | null
  setWorkspaces: (ws: Workspace[]) => void
  setActiveWorkspace: (id: string) => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      workspaces: [],
      activeWorkspaceId: null,
      setWorkspaces: (workspaces) =>
        set((s) => ({
          workspaces,
          activeWorkspaceId: s.activeWorkspaceId ?? workspaces[0]?.id ?? null,
        })),
      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
    }),
    {
      name: 'chatbot-workspace',
      storage: {
        getItem: (k) => sessionStorage.getItem(k),
        setItem: (k, v) => sessionStorage.setItem(k, v),
        removeItem: (k) => sessionStorage.removeItem(k),
      },
    }
  )
)
