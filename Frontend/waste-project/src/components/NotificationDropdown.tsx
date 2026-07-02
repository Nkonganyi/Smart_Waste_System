import { useEffect, useState } from 'react'
import { Bell, Clock, CheckCheck, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { useNotificationStore } from '@/stores/notificationStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/utils'
import { useNavigate, Link } from 'react-router-dom'

export function NotificationDropdown() {
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore()
  const user = useAuthStore(state => state.user)
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  const handleViewAll = () => {
    setIsOpen(false)
    if (user?.role === 'admin') {
      navigate('/admin/notifications')
    } else if (user?.role === 'collector') {
      navigate('/collector/notifications')
    } else if (user?.role === 'citizen') {
      navigate('/citizen/notifications')
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-2 ring-card">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={markAllAsRead}>
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="mx-auto h-10 w-10 opacity-20 mb-3" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            notifications.map(notification => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex flex-col items-start gap-1 p-4 cursor-default",
                  !notification.is_read && "bg-primary/5"
                )}
                onClick={() => {
                  if (!notification.is_read) {
                    markAsRead(notification.id)
                  }
                }}
              >
                <div className="flex items-start justify-between w-full">
                  <p className="text-sm font-medium leading-tight">
                    {notification.message}
                  </p>
                  {!notification.is_read && (
                    <Badge variant="secondary" className="h-1.5 w-1.5 rounded-full p-0 bg-primary" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDistanceToNow(parseISO(notification.created_at), { addSuffix: true })}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="justify-center cursor-pointer text-sm text-muted-foreground" 
          onClick={handleViewAll}
        >
          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
