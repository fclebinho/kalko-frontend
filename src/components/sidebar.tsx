'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import {
  LayoutDashboard,
  Package,
  ChefHat,
  DollarSign,
  List,
  Calculator,
  Sparkles,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Ingredientes', href: '/ingredients', icon: Package },
  { name: 'Receitas', href: '/recipes', icon: ChefHat },
  { name: 'Custos', href: '/costs', icon: DollarSign },
  { name: 'Precos', href: '/price-list', icon: List },
  { name: 'Pedidos', href: '/orders', icon: Calculator },
  { name: 'Planos', href: '/pricing', icon: Sparkles },
  { name: 'Configuracoes', href: '/settings', icon: Settings },
]

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useUser()

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-200 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* User section */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-sidebar-border">
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'h-10 w-10',
              },
            }}
            afterSignOutUrl="/sign-in"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">
              {user?.firstName || 'Usuario'}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {user?.primaryEmailAddress?.emailAddress || ''}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname?.startsWith(item.href)

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

        {/* Branding */}
        <div className="px-5 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            <span className="text-sm font-bold">Kalko</span>
          </div>
        </div>
      </aside>
    </>
  )
}
