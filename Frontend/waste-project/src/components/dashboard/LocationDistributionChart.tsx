import { useState, useEffect } from 'react'
import { reportsAPI } from '@/lib/api'
import type { Report } from '@/types'
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const COLORS = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--accent))']

export function LocationDistributionChart() {
  const [data, setData] = useState<{ name: string, value: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await reportsAPI.getAllReports()
        const reports: Report[] = Array.isArray(response.data) ? response.data : []
        
        // Group by location/sector
        const distribution = reports.reduce((acc: Record<string, number>, report) => {
          // Extract sector/area name from location string if possible, or use the whole string
          const location = report.location.split(',')[0].trim() || 'Unknown'
          acc[location] = (acc[location] || 0) + 1
          return acc
        }, {})

        const chartData = Object.entries(distribution)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5) // Top 5 locations

        setData(chartData)
      } catch (err) {
        console.error('Failed to fetch distribution data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <Card className="border-none shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Location Distribution</CardTitle>
        <p className="text-xs text-muted-foreground">Reports by sector</p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full min-h-[300px]">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center">
              <Skeleton className="h-[200px] w-[200px] rounded-full" />
            </div>
          ) : data.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
