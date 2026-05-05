import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, MapPin, Clock } from 'lucide-react'

const activities = [
  {
    id: '1',
    title: 'New Waste Report',
    location: 'Sector 4, Green Park',
    time: '2 hours ago',
    status: 'pending',
    priority: 'high'
  },
  {
    id: '2',
    title: 'Report Completed',
    location: 'Industrial Zone A',
    time: '4 hours ago',
    status: 'completed',
    priority: 'medium'
  },
  {
    id: '3',
    title: 'Collector Assigned',
    location: 'Downtown Mall',
    time: 'Yesterday',
    status: 'in_progress',
    priority: 'low'
  }
]

export function RecentActivity() {
  return (
    <Card className="col-span-2 border-none shadow-soft">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
        <p className="text-sm text-muted-foreground">Latest reports and updates from the field</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <FileText size={18} className="text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                  <Badge variant={activity.status === 'completed' ? 'success' : activity.status === 'pending' ? 'warning' : 'info'}>
                    {activity.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {activity.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {activity.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
