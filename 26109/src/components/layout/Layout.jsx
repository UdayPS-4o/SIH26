import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import BottomNav from './BottomNav.jsx'

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <div className="flex min-h-screen bg-sand-50 dark:bg-barn-950">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 px-2.5 py-3 pb-20 md:px-6 md:py-6 md:pb-8">
          <div className="mx-auto max-w-[1560px]">
            <Outlet />
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
