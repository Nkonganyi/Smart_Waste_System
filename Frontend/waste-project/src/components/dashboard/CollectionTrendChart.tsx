import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

const data = [
  { name: 'Jan', collected: 400 },
  { name: 'Feb', collected: 300 },
  { name: 'Mar', collected: 600 },
  { name: 'Apr', collected: 800 },
  { name: 'May', collected: 500 },
  { name: 'Jun', collected: 900 },
]

export function CollectionTrendChart() {
  return (
    <Card className="border-none shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Collection Trend</CardTitle>
        <p className="text-xs text-muted-foreground">Waste collected over time (kg)</p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
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
                  fontSize: '12px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="collected" 
                stroke="hsl(var(--primary))" 
                fillOpacity={1} 
                fill="url(#colorTrend)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
