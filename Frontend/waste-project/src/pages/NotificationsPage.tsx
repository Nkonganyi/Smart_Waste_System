import { useEffect } from 'react'
import { Bell, CheckCheck, Trash2, Clock } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { useNotificationStore } from '@/stores/notificationStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/utils'

export function NotificationsPage() {
  const { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore()
  const user = useAuthStore(state => state.user)

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">Stay updated with your latest alerts and assignments.</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="secondary" onClick={markAllAsRead} className="gap-2">
              <CheckCheck size={16} />
              Mark all as read
            </Button>
          )}
        </div>

        <Card className="border-none shadow-soft">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Bell size={20} />
                </div>
                <div>
                  <CardTitle className="text-xl">Your Notifications</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {loading ? 'Loading...' : `${notifications.length} total, ${unreadCount} unread`}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {loading ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="h-10 w-10 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-muted rounded" />
                        <div className="h-3 w-1/2 bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 text-muted-foreground">
                  <Bell className="h-16 w-16 opacity-20 mb-4" />
                  <p className="text-lg font-medium">No notifications</p>
                  <p className="text-sm">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex items-start gap-4 p-6 transition-colors",
                        !notification.is_read ? "bg-primary/5" : "hover:bg-muted/30"
                      )}
                    >
                      <div className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        notification.is_read ? "bg-muted" : "bg-primary/10 text-primary"
                      )}>
                        <Bell size={18} />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-sm font-medium text-foreground">
                            {notification.message}
                          </p>
                          {!notification.is_read && (
                            <Badge variant="secondary" className="h-2 w-2 rounded-full p-0 bg-primary shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <Clock size={12} />
                            {formatDistanceToNow(parseISO(notification.created_at), { addSuffix: true })}
                          </div>
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => markAsRead(notification.id)}
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
