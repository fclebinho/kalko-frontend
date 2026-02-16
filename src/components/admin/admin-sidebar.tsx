'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Blocks,
  CreditCard,
  ArrowLeft,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const adminNavItems = [
  { name: 'Features', href: '/admin/features', icon: Blocks },
  { name: 'Planos', href: '/admin/plans', icon: CreditCard },
]

interface AdminSidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

export function AdminSidebar({ mobileOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-200 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Admin header */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-sidebar-border">
          <Shield className="h-6 w-6 text-orange-500" />
          <div>
            <p className="text-sm font-semibold">Admin</p>
            <p className="text-xs text-sidebar-foreground/60">Kalko</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname?.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Back to app */}
        <div className="px-3 py-4 border-t border-sidebar-border">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5 flex-shrink-0" />
            <span>Voltar ao App</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
