import { create } from 'zustand'
import { notificationsAPI } from '@/lib/api'

interface Notification {
  id: string
  message: string
  user_id: string
  is_read: boolean
  created_at: string
  users?: {
    name: string
    email: string
  }
}

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true })
    try {
      const response = await notificationsAPI.getMyNotifications()
      const notifications = response.data || []
      const unreadCount = notifications.filter((n: Notification) => !n.is_read).length
      set({ notifications, unreadCount, loading: false })
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
      set({ loading: false })
    }
  },

  markAsRead: async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id)
      const notifications = get().notifications.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      )
      const unreadCount = notifications.filter(n => !n.is_read).length
      set({ notifications, unreadCount })
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationsAPI.markAllAsRead()
      const notifications = get().notifications.map(n => ({ ...n, is_read: true }))
      set({ notifications, unreadCount: 0 })
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
    }
  }
}))
