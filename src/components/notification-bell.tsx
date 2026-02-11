'use client'

import { useEffect, useState, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { notificationsApi, AppNotification } from '@/lib/api'
import Link from 'next/link'

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'agora'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationsApi.getUnreadCount()
      setUnreadCount(res.data.count)
    } catch {
      // ignore
    }
  }, [])

  // Poll unread count every 60s
  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 60000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const res = await notificationsApi.list({ limit: 20 })
      setNotifications(res.data.data)
      setUnreadCount(res.data.unreadCount)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      loadNotifications()
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead()
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch {
      // ignore
    }
  }

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id)
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      // ignore
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold text-sm">Notificações</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1"
              onClick={handleMarkAllRead}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhuma notificação
            </div>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${
                  !notification.read ? 'bg-blue-50/50' : ''
                }`}
                onClick={() => {
                  if (!notification.read) handleMarkRead(notification.id)
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                      <p className="text-sm font-medium truncate">
                        {notification.title}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    {notification.type === 'price_increase' &&
                      notification.data?.affectedRecipes &&
                      notification.data.affectedRecipes.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {notification.data.affectedRecipes.slice(0, 3).map(recipe => (
                            <Link
                              key={recipe.id}
                              href={`/recipes/${recipe.id}`}
                              className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1 hover:bg-muted"
                              onClick={e => e.stopPropagation()}
                            >
                              <span className="text-primary truncate">{recipe.name}</span>
                              <span className="text-muted-foreground ml-2 flex-shrink-0">
                                R${recipe.oldIngredientCost.toFixed(2)} → R${recipe.newIngredientCost.toFixed(2)}
                              </span>
                            </Link>
                          ))}
                          {notification.data.affectedRecipes.length > 3 && (
                            <p className="text-xs text-muted-foreground pl-2">
                              +{notification.data.affectedRecipes.length - 3} mais
                            </p>
                          )}
                        </div>
                      )}
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {timeAgo(notification.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
