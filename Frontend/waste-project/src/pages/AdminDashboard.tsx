import { useEffect, useState } from 'react'
import { dashboardAPI } from '@/lib/api'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { OverviewChart } from '@/components/dashboard/OverviewChart'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { 
  Trash2, 
  Users, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface AdminStats {
  totalReports: number
  pending: number
  completed: number
  collectors: number
  pending_raw: number
  inProgress: number
  highPriority: number
  lowPriority: number
  totalUsers: number
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardAPI.getAdminStats()
        setStats(response.data)
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const efficiency = stats?.completed && stats.totalReports
    ? Math.round((stats.completed / stats.totalReports) * 100)
    : 0

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-5">
            <Skeleton className="col-span-3 h-[450px] rounded-xl" />
            <Skeleton className="col-span-2 h-[450px] rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
          <p className="text-muted-foreground">Welcome back, here's what's happening today.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label="Total Reports"
            value={stats?.totalReports ?? 0}
            icon={Trash2}
            color="primary"
            trend={{ value: 12, isPositive: true }}
            description="Total waste reports submitted"
          />
          <StatsCard
            label="Pending"
            value={stats?.pending_raw ?? 0}
            icon={Clock}
            color="warning"
            description="Awaiting collector assignment"
          />
          <StatsCard
            label="Collection Efficiency"
            value={`${efficiency}%`}
            icon={TrendingUp}
            color="success"
            trend={{ value: 5, isPositive: true }}
            description="Reports completed vs total"
          />
          <StatsCard
            label="Active Collectors"
            value={stats?.collectors ?? 0}
            icon={Users}
            color="info"
            description="Personnel currently on duty"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <OverviewChart />
          <RecentActivity />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <StatsCard
            label="High Priority Issues"
            value={stats?.highPriority ?? 0}
            icon={AlertTriangle}
            color="destructive"
            description="Requires immediate attention"
          />
          <StatsCard
            label="Total Users"
            value={stats?.totalUsers ?? 0}
            icon={Users}
            color="info"
            trend={{ value: 8, isPositive: true }}
            description="Citizens and staff registered"
          />
          <StatsCard
            label="Completed Today"
            value={stats?.completed ?? 0}
            icon={CheckCircle2}
            color="success"
            description="Waste pickups finalized"
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
