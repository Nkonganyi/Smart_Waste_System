import { useEffect, useState } from 'react'
import { dashboardAPI } from '@/lib/api'
import { AdminLayout } from '@/components/AdminLayout'
import { ReportsByLocationChart } from '@/components/ReportsByLocationChart'
import { RecentReportsTable } from '@/components/RecentReportsTable'
import { LocationMapPreview } from '@/components/LocationMapPreview'
import { TimeSeriesChart } from '@/components/TimeSeriesChart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface AdminStats {
  totalReports: number
  pending: number
  completed: number
  collectors: number
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

  if (loading) return <AdminLayout><div className="text-center py-8">Loading...</div></AdminLayout>

  return (
    <AdminLayout>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Total Reports</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalReports || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Pending</div>
          <div className="text-3xl font-bold text-yellow-600 mt-2">{stats?.pending || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Completed</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{stats?.completed || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Active Collectors</div>
          <div className="text-3xl font-bold text-purple-600 mt-2">{stats?.collectors || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Collection Efficiency</div>
          <div className="text-3xl font-bold text-orange-600 mt-2">
            {stats?.completed && stats.totalReports 
              ? Math.round((stats.completed / stats.totalReports) * 100) 
              : 0}%
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Reports Overview Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Reports Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[stats || {}]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalReports" fill="#3b82f6" name="Total" />
              <Bar dataKey="pending" fill="#eab308" name="Pending" />
              <Bar dataKey="completed" fill="#22c55e" name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Reports by Location Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Reports by Location</h2>
          <ReportsByLocationChart />
        </div>
      </div>

      {/* Waste Collected Over Time Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Waste Collected Over Time</h2>
        <TimeSeriesChart />
      </div>

      {/* Recent Reports and Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h2>
          <RecentReportsTable />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location Map</h2>
          <LocationMapPreview />
        </div>
      </div>
    </AdminLayout>
  )
}
