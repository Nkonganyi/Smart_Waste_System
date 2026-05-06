import { useState, useEffect } from 'react'
import { reportsAPI } from '@/lib/api'
import type { Report } from '@/types'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { format, subDays, isSameDay, parseISO } from 'date-fns'

export function OverviewChart() {
  const [data, setData] = useState<{ name: string, reported: number, collected: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await reportsAPI.getAllReports()
        const reports: Report[] = Array.isArray(response.data) ? response.data : []
        
        // Last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = subDays(new Date(), i)
          return {
            date,
            name: format(date, 'EEE'),
            reported: 0,
            collected: 0
          }
        }).reverse()

        reports.forEach(report => {
          const reportDate = parseISO(report.created_at)
          const dayData = last7Days.find(d => isSameDay(d.date, reportDate))
          if (dayData) {
            dayData.reported++
            if (report.status === 'completed') {
              dayData.collected++
            }
          }
        })

        setData(last7Days.map(({ name, reported, collected }) => ({ name, reported, collected })))
      } catch (err) {
        console.error('Failed to fetch overview data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <Card className="border-none shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Collection Overview</CardTitle>
        <p className="text-xs text-muted-foreground">Last 7 days activity</p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full min-h-[300px]">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar 
                  dataKey="reported" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]} 
                  animationDuration={1500}
                />
                <Bar 
                  dataKey="collected" 
                  fill="hsl(var(--info))" 
                  radius={[4, 4, 0, 0]} 
                  animationDuration={1500}
                  animationBegin={300}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
