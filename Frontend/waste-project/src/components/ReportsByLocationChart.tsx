import { useEffect, useState } from 'react'
import { dashboardAPI } from '@/lib/api'
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface LocationData {
  location: string
  count: number
}

const BAR_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function ReportsByLocationChart() {
  const [data, setData] = useState<LocationData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await dashboardAPI.getReportsPerLocation()
        const sorted = ((response.data || []) as LocationData[])
          .sort((a, b) => b.count - a.count)
          .slice(0, 6)
        setData(sorted)
      } catch {
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div className="h-48 flex items-center justify-center text-sm text-gray-400">Loading…</div>
  if (error) return <div className="h-48 flex items-center justify-center text-sm text-red-400">{error}</div>
  if (!data.length) return <div className="h-48 flex items-center justify-center text-sm text-gray-400">No location data yet</div>

  return (
    <ResponsiveContainer width="100%" height={data.length * 36 + 20}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis
          type="category" dataKey="location"
          tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={88}
          tickFormatter={(v: string) => (v.length > 12 ? `${v.slice(0, 12)}…` : v)}
        />
        <Tooltip
          contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '12px' }}
          formatter={(v) => [`${v} reports`, 'Reports']}
        />
        <Bar dataKey="count" radius={[0, 5, 5, 0]}>
          {data.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
