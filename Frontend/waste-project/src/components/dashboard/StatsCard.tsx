import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/utils'

interface StatsCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'secondary'
}

const colorMap = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  destructive: 'bg-destructive/10 text-destructive border-destructive/20',
  info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  secondary: 'bg-secondary text-secondary-foreground border-border',
}

export function StatsCard({ label, value, icon: Icon, description, trend, color = 'primary' }: StatsCardProps) {
  return (
    <Card className="overflow-hidden border-none shadow-soft transition-all hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl border", colorMap[color])}>
            <Icon size={24} />
          </div>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold",
              trend.isPositive ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
            )}>
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <h3 className="mt-1 text-3xl font-bold tracking-tight text-foreground">{value}</h3>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
