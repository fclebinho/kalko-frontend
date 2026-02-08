'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { LayoutDashboard, Package, ChefHat, DollarSign, CreditCard, Sparkles } from 'lucide-react'

const navItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard
  },
  {
    name: 'Ingredientes',
    href: '/ingredients',
    icon: Package
  },
  {
    name: 'Receitas',
    href: '/recipes',
    icon: ChefHat
  },
  {
    name: 'Custos',
    href: '/costs',
    icon: DollarSign
  },
  {
    name: 'Planos',
    href: '/pricing',
    icon: Sparkles
  },
  {
    name: 'Assinatura',
    href: '/billing',
    icon: CreditCard
  }
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6" />
            <span className="text-xl font-bold">Precificação</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>

            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'h-10 w-10',
                },
              }}
              afterSignOutUrl="/sign-in"
            />
          </div>
        </div>
      </div>
    </nav>
  )
}
