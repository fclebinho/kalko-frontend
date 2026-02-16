'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { adminApi } from '@/lib/api'
import { AdminSidebar } from './admin-sidebar'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    adminApi.checkAdmin()
      .then(() => setIsAdmin(true))
      .catch(() => {
        setIsAdmin(false)
        router.replace('/')
      })
  }, [router])

  if (isAdmin === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Verificando acesso...</p>
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop header */}
        <div className="hidden lg:flex h-14 border-b bg-background items-center px-6 flex-shrink-0">
          <span className="text-sm font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded">
            Admin
          </span>
        </div>

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
          <span className="ml-2 text-sm font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded">
            Admin
          </span>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
