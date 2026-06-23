import { create } from 'zustand'

interface UpgradeState {
  reason: string | null
  show: (reason: string) => void
  hide: () => void
}

export const useUpgradeStore = create<UpgradeState>((set) => ({
  reason: null,
  show: (reason) => set({ reason }),
  hide: () => set({ reason: null }),
}))
