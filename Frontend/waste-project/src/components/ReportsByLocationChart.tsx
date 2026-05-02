import { useEffect, useState } from 'react'
import { dashboardAPI } from '@/lib/api'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

interface LocationData {
  location: string
  count: number
}

export function ReportsByLocationChart() {
  const [data, setData] = useState<LocationData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await dashboardAPI.getReportsPerLocation()
        setData(response.data)
      } catch (err) {
        console.error('Failed to fetch reports by location:', err)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div className="h-80 flex items-center justify-center text-gray-400">Loading...</div>
  }

  if (error) {
    return <div className="h-80 flex items-center justify-center text-red-500">{error}</div>
  }

  if (!data || data.length === 0) {
    return <div className="h-80 flex items-center justify-center text-gray-400">No data available</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(entry: any) => `${entry.location}: ${entry.count}`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="count"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `${value} reports`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
