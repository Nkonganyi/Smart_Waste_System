import { useEffect, useState } from 'react'
import { dashboardAPI } from '@/lib/api'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { OverviewChart } from '@/components/dashboard/OverviewChart'
import { LocationDistributionChart } from '@/components/dashboard/LocationDistributionChart'
import { RecentReportsTable } from '@/components/dashboard/RecentReportsTable'
import { DashboardMapPreview } from '@/components/dashboard/DashboardMapPreview'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { 
  Trash2, 
  Clock, 
  TrendingUp,
  Activity,
  CheckCircle
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-[400px] rounded-xl" />
            <Skeleton className="h-[400px] rounded-xl" />
            <Skeleton className="h-[400px] rounded-xl" />
          </div>
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <ErrorBoundary>
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Comprehensive system overview and real-time monitoring.</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatsCard
              label="Collection Efficiency"
              value={`${efficiency}%`}
              icon={TrendingUp}
              color="success"
              description="Overall completion rate"
            />
            <StatsCard
              label="Active Reports"
              value={stats?.inProgress ?? 0}
              icon={Activity}
              color="info"
              description="Currently being handled"
            />
            <StatsCard
              label="Total Reports"
              value={stats?.totalReports ?? 0}
              icon={Trash2}
              color="primary"
              description="All reports submitted"
            />
            <StatsCard
              label="Pending Reports"
              value={stats?.pending_raw ?? 0}
              icon={Clock}
              color="warning"
              description="Awaiting assignment"
            />
            <StatsCard
              label="Completed Reports"
              value={stats?.completed ?? 0}
              icon={CheckCircle}
              color="success"
              description="Pickups finalized"
            />
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            <OverviewChart />
            <LocationDistributionChart />
          </div>

          {/* Recent Reports Table & Activity */}
          <div className="grid gap-6 lg:grid-cols-5">
            <RecentReportsTable />
            <RecentActivity />
          </div>

          {/* Map Preview */}
          <DashboardMapPreview />
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  )
}
