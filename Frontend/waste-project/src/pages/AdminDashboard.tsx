import { useEffect, useState } from 'react'
import { dashboardAPI } from '@/lib/api'
import { AdminLayout } from '@/components/AdminLayout'
import { ReportsByLocationChart } from '@/components/ReportsByLocationChart'
import { RecentReportsTable } from '@/components/RecentReportsTable'
import { LocationMapPreview } from '@/components/LocationMapPreview'
import { TimeSeriesChart } from '@/components/TimeSeriesChart'
import {
  Trash2, Clock, CheckCircle2, Users, TrendingUp,
  AlertTriangle, ArrowUpRight,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

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

interface KPICardProps {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  label: string
  value: string | number
  sub?: string
}

function KPICard({ icon: Icon, iconBg, iconColor, label, value, sub }: KPICardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`${iconBg} rounded-xl p-3 flex-shrink-0`}>
        <Icon className={iconColor} size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  const dateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

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

  const efficiency =
    stats?.completed && stats.totalReports
      ? Math.round((stats.completed / stats.totalReports) * 100)
      : 0

  const statusDonutData = [
    { name: 'Pending', value: stats?.pending_raw || 0, color: '#f59e0b' },
    { name: 'In Progress', value: stats?.inProgress || 0, color: '#3b82f6' },
    { name: 'Completed', value: stats?.completed || 0, color: '#10b981' },
  ].filter((d) => d.value > 0)

  if (loading) {
    return (
      <AdminLayout>
        <div className="h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading dashboard…</span>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">
            Operations Dashboard
          </h1>
          <p className="text-sm text-gray-400 mt-1">{dateStr}</p>
        </div>
        {(stats?.highPriority ?? 0) > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-2.5 rounded-xl">
            <AlertTriangle size={15} />
            {stats!.highPriority} high-priority report
            {stats!.highPriority !== 1 ? 's' : ''} pending
          </div>
        )}
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KPICard
          icon={Trash2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          label="Total Reports"
          value={stats?.totalReports ?? 0}
        />
        <KPICard
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
          label="Pending / Active"
          value={stats?.pending ?? 0}
          sub={`${stats?.pending_raw ?? 0} new · ${stats?.inProgress ?? 0} in progress`}
        />
        <KPICard
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          label="Completed"
          value={stats?.completed ?? 0}
        />
        <KPICard
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          label="Collectors"
          value={stats?.collectors ?? 0}
        />

        {/* Efficiency card with progress bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between col-span-2 lg:col-span-1 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-emerald-50 rounded-xl p-3 flex-shrink-0">
              <TrendingUp className="text-emerald-600" size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Efficiency</p>
              <p className="text-2xl font-bold text-gray-900 leading-tight">{efficiency}%</p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>Collection rate</span>
              <span>{efficiency}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              {/* Dynamic width must use inline style — Tailwind classes are static and cannot express runtime percentages */}
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-700"
                style={{ width: `${efficiency}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Area Chart — 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Reports Over Time</h2>
              <p className="text-xs text-gray-400 mt-0.5">Daily submissions — last 30 days</p>
            </div>
          </div>
          <TimeSeriesChart />
        </div>

        {/* Status Donut — 1/3 width */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-0.5">Status Breakdown</h2>
          <p className="text-xs text-gray-400 mb-4">All reports by current status</p>
          {statusDonutData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusDonutData}
                  cx="50%"
                  cy="45%"
                  innerRadius={62}
                  outerRadius={88}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {statusDonutData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [`${v} reports`]}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-sm text-gray-400">
              No report data yet
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Reports Table — 2/3 */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Recent Reports</h2>
              <p className="text-xs text-gray-400 mt-0.5">Latest 5 submitted reports</p>
            </div>
            <a
              href="/admin/reports"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 transition-colors"
            >
              View all <ArrowUpRight size={13} />
            </a>
          </div>
          <RecentReportsTable />
        </div>

        {/* Right column: Location chart + Map */}
        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-0.5">Hotspot Locations</h2>
            <p className="text-xs text-gray-400 mb-4">Top areas by report volume</p>
            <ReportsByLocationChart />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Live Map</h2>
              <p className="text-xs text-gray-400 mt-0.5">Report locations — Buea</p>
            </div>
            <LocationMapPreview />
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
