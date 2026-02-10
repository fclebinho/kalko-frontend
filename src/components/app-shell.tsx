'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Sidebar } from '@/components/sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden h-14 border-b bg-background flex items-center px-4 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 -ml-2 rounded-lg hover:bg-muted"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
          <span className="ml-2 font-bold">Kalko</span>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
