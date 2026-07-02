import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Bell, FileText, Clock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { dashboardAPI } from '@/lib/api'

interface ActivityItem {
  id: string
  type: 'notification' | 'report_created'
  message: string
  user: { name: string; role?: string }
  timestamp: string
}

export function SystemActivityLog() {
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await dashboardAPI.getSystemActivity(30)
        setActivity(response.data || [])
      } catch (err) {
        console.error('Failed to fetch system activity:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'notification':
        return <Bell className="h-4 w-4 text-blue-500" />
      case 'report_created':
        return <FileText className="h-4 w-4 text-amber-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'notification':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'report_created':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-500" />
          <CardTitle className="text-xl">System Activity</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
        {activity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Activity className="h-10 w-10 opacity-20 mb-3" />
            <p className="text-sm">No activity recorded</p>
          </div>
        ) : (
          activity.map(item => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-xl border p-3 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getActivityColor(item.type)}`}>
                {getActivityIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">
                  {item.message}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {item.user?.name && (
                    <span className="font-semibold">{item.user.name}</span>
                  )}
                  {item.user?.role && (
                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                      {item.user.role}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(parseISO(item.timestamp), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
