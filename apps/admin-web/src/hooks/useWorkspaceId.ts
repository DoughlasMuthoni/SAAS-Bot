import { useWorkspaceStore } from '../lib/workspace'

export function useWorkspaceId(): string {
  return useWorkspaceStore((s) => s.activeWorkspaceId ?? '')
}
