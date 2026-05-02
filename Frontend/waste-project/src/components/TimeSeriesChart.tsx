import { useEffect, useState } from 'react'
import { dashboardAPI } from '@/lib/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface TrendData {
  date: string
  count: number
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
      } catch (err) {
        console.error('Failed to fetch report trends:', err)
        setError('Failed to load trends')
      } finally {
        setLoading(false)
      }
    }

    fetchTrends()
  }, [])

  if (loading) {
    return <div className="h-80 flex items-center justify-center text-gray-400">Loading...</div>
  }

  if (error) {
    return <div className="h-80 flex items-center justify-center text-red-500">{error}</div>
  }

  if (!data || data.length === 0) {
    return <div className="h-80 flex items-center justify-center text-gray-400">No trend data available</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis />
        <Tooltip 
          formatter={(value) => [`${value} reports`, 'Reports']}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="count" 
          stroke="#3b82f6" 
          name="Reports Collected"
          dot={{ fill: '#3b82f6' }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
