import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, MapPin, Calendar } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { dashboardAPI } from '@/lib/api'

interface CompletedTask {
  id: string
  title: string
  location: string
  priority: string
  completed_at: string
  users: { name: string; email: string }
}

export function CompletedTasksTable() {
  const [tasks, setTasks] = useState<CompletedTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await dashboardAPI.getCompletedTasks(7) // Last 7 days
        setTasks(response.data || [])
      } catch (err) {
        console.error('Failed to fetch completed tasks:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'medium': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1,2,3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="lg:col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-emerald-500" />
          <CardTitle className="text-xl">Completed Tasks</CardTitle>
        </div>
        <span className="text-sm text-muted-foreground">Last 7 Days</span>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <CheckCircle className="h-10 w-10 opacity-20 mb-3" />
            <p className="text-sm">No completed tasks yet</p>
          </div>
        ) : (
          tasks.map(task => (
            <div
              key={task.id}
              className="flex items-center gap-4 rounded-xl border p-4 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold truncate">{task.title}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{task.location}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(task.completed_at), 'MMM d, h:mm a')}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {task.users?.name || 'Unknown'}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
