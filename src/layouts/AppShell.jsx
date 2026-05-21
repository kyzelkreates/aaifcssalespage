/**
 * ============================================================
 * APEX AI — Application Shell (Root Layout)
 * /src/layouts/AppShell.jsx
 *
 * Wraps all protected pages with sidebar + topnav.
 * ============================================================
 */

import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopNav  from './TopNav'

export default function AppShell() {
  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-[#050810]">

      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Top Navigation */}
        <TopNav />

        {/* Page Content */}
        <main className="flex-1 overflow-auto scrollbar-none">
          <Outlet />
        </main>

      </div>
    </div>
  )
}
