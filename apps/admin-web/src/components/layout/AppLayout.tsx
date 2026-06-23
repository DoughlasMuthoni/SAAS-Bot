import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useWorkspaceInit } from '../../hooks/useWorkspaceInit'
import { useUpgradeStore } from '../../lib/upgradeStore'
import UpgradeModal from '../UpgradeModal'

export default function AppLayout() {
  useWorkspaceInit()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { reason, hide } = useUpgradeStore()

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div className={`cb-overlay ${sidebarOpen ? 'is-open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="cb-main">
          <Outlet />
        </main>
      </div>
      {reason && <UpgradeModal reason={reason} onClose={hide} />}
    </div>
  )
}
