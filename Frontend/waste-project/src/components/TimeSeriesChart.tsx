import { useEffect, useState } from 'react'
import { dashboardAPI } from '@/lib/api'
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

interface TrendData {
  date: string
  count: number
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
}

export function TimeSeriesChart() {
  const [data, setData] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const response = await dashboardAPI.getReportTrends(30)
        setData(response.data?.daily_counts || [])
      } catch {
        setError('Failed to load trends')
      } finally {
        setLoading(false)
      }
    }
    fetchTrends()
  }, [])

  if (loading) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-gray-400">
        Loading…
      </div>
    )
  }
  if (error) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-red-400">
        {error}
      </div>
    )
  }
  if (!data.length) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-gray-400">
        No activity in the last 30 days
      </div>
    )
  }

  const chartData = data.map((d) => ({ ...d, date: formatDate(d.date) }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -14 }}>
        <defs>
          <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '10px',
            border: '1px solid #e5e7eb',
            fontSize: '12px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          }}
          formatter={(v) => [`${v} reports`, 'Submitted']}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#emeraldGradient)"
          dot={false}
          activeDot={{ r: 5, fill: '#10b981', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
