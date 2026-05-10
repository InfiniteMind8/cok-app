'use client'

import { useState, useTransition, useEffect } from 'react'
import { format, formatDistance } from 'date-fns'
import { Bell, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { meApi, getBrowserApi } from '@/lib/api'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  readAt: Date | null
  createdAt: Date
}

interface NotificationListProps {
  notifications: Notification[]
}

export function NotificationList({ notifications: initialNotifications }: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [isPending, startTransition] = useTransition()

  const hasUnread = notifications.some((n) => !n.readAt)
  const now = new Date()

  // Auto-mark all as read on mount when there are unread notifications
  useEffect(() => {
    if (!hasUnread) return
    meApi.markAllNotificationsRead(getBrowserApi())
      .then(() => {
        setNotifications((prev) =>
          prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date() })),
        )
      })
      .catch(() => {
        // Silent — badge will clear on next navigation anyway
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleMarkAllRead() {
    startTransition(async () => {
      try {
        await meApi.markAllNotificationsRead(getBrowserApi())
        setNotifications((prev) =>
          prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date() })),
        )
      } catch {
        toast.error('Failed to mark notifications as read')
      }
    })
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Bell size={40} strokeWidth={1.25} className="text-karis-stone-300 mb-4" />
        <h3 className="font-heading text-lg text-karis-green-900 mb-1">No notifications</h3>
        <p className="font-body text-sm text-karis-stone-500 max-w-xs">
          No notifications yet. Your activity will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {hasUnread && (
        <div className="flex justify-end">
          <Button
            onClick={handleMarkAllRead}
            disabled={isPending}
            variant="outline"
            className="font-body text-xs border-karis-stone-300 text-karis-stone-700 gap-1.5 min-h-[44px]"
          >
            <Check size={13} />
            Mark all read
          </Button>
        </div>
      )}

      <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm divide-y divide-karis-stone-100">
        {notifications.map((n) => {
          const date = new Date(n.createdAt)
          const daysAgo = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
          const dateLabel =
            daysAgo < 7
              ? formatDistance(date, now, { addSuffix: true })
              : format(date, 'dd MMM yyyy')

          const content = (
            <div className={cn('flex items-start gap-3 p-4 min-h-[44px]', !n.readAt ? 'bg-karis-green-900/[0.04]' : '')}>
              <div className="shrink-0 mt-1">
                {!n.readAt ? (
                  <div className="w-2 h-2 rounded-full bg-karis-gold-500" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-karis-stone-200" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('font-body text-sm leading-snug', !n.readAt ? 'text-karis-green-900 font-medium' : 'text-karis-stone-700')}>
                  {n.title}
                </p>
                {n.body && (
                  <p className="font-body text-xs text-karis-stone-500 mt-0.5 leading-relaxed">
                    {n.body}
                  </p>
                )}
                <p className="font-body text-[10px] text-karis-stone-400 mt-1">{dateLabel}</p>
              </div>
            </div>
          )

          if (n.link) {
            return (
              <a key={n.id} href={n.link} className="block hover:bg-karis-stone-50 transition-colors duration-150">
                {content}
              </a>
            )
          }

          return <div key={n.id}>{content}</div>
        })}
      </div>
    </div>
  )
}
