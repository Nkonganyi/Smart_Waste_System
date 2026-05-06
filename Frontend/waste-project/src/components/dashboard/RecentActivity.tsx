import { useState, useEffect } from 'react'
import { notificationsAPI } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, Clock, User } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'

interface Activity {
  id: string
  message: string
  created_at: string
  user_id: string
  users?: {
    name: string
    email: string
  }
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await notificationsAPI.getAllNotifications()
        setActivities(response.data)
      } catch (err: any) {
        console.error('Failed to fetch activities:', err)
        // If it's a 404, it might be because the endpoint is still being deployed or doesn't exist
        if (err?.response?.status === 404) {
          setActivities([])
        }
      } finally {
        setLoading(false)
      }
    }
    fetchActivities()
  }, [])

  const getActivityIcon = (message: string) => {
    if (message.toLowerCase().includes('completed')) return <Badge variant="success" className="h-5 px-1.5">Done</Badge>
    if (message.toLowerCase().includes('approved')) return <Badge variant="info" className="h-5 px-1.5">OK</Badge>
    if (message.toLowerCase().includes('submitted')) return <Badge variant="warning" className="h-5 px-1.5">New</Badge>
    return <Badge variant="secondary" className="h-5 px-1.5">Info</Badge>
  }

  return (
    <Card className="col-span-2 border-none shadow-soft">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
        <p className="text-sm text-muted-foreground">Latest system updates and logs</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
              </div>
            ))
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No recent activity recorded.
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex gap-4 group">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                  <Bell size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 space-y-1 overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {activity.message}
                    </p>
                    {getActivityIcon(activity.message)}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {activity.users?.name || 'System'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDistanceToNow(parseISO(activity.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
