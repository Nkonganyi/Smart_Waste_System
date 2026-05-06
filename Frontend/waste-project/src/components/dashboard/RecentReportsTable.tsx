import { useState, useEffect } from 'react'
import { reportsAPI } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  X,
  Calendar as CalendarIcon
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Report } from '@/types'
import { formatDate } from '@/utils'
import { isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns'

export function RecentReportsTable() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await reportsAPI.getAllReports()
        setReports(response.data)
      } catch (err) {
        console.error('Failed to fetch reports:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [])

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || report.priority === priorityFilter
    
    let matchesDate = true
    if (startDate || endDate) {
      const reportDate = parseISO(report.created_at)
      const start = startDate ? startOfDay(new Date(startDate)) : new Date(0)
      const end = endDate ? endOfDay(new Date(endDate)) : new Date()
      matchesDate = isWithinInterval(reportDate, { start, end })
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesDate
  })

  // Take only the 5 most recent for the dashboard view
  const dashboardReports = filteredReports.slice(0, 5)

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setStartDate('')
    setEndDate('')
  }

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all' || priorityFilter !== 'all' || startDate !== '' || endDate !== ''

  return (
    <Card className="lg:col-span-3 border-none shadow-soft overflow-hidden">
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Recent Reports</CardTitle>
            <p className="text-sm text-muted-foreground">Manage and track latest submissions</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-8 h-8 w-[150px] lg:w-[200px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant={showFilters ? "secondary" : "outline"} 
              size="sm" 
              className="h-8 gap-1"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={14} />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] bg-primary text-primary-foreground">
                  !
                </Badge>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground" onClick={clearFilters}>
                <X size={14} />
              </Button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-muted-foreground px-1">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-muted-foreground px-1">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-muted-foreground px-1">Start Date</label>
              <div className="relative">
                <CalendarIcon className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-8 h-8 text-xs"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-muted-foreground px-1">End Date</label>
              <div className="relative">
                <CalendarIcon className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-8 h-8 text-xs"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">
                <Button variant="ghost" size="sm" className="-ml-3 h-8 gap-1 hover:bg-transparent">
                  Title
                  <ArrowUpDown size={12} />
                </Button>
              </TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="text-right pr-6">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [1, 2, 3, 4, 5].map(i => (
                <TableRow key={i}>
                  <TableCell className="pl-6"><div className="h-4 w-32 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-6 w-16 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-6 w-16 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell className="pr-6"><div className="ml-auto h-4 w-16 animate-pulse rounded bg-muted" /></TableCell>
                </TableRow>
              ))
            ) : dashboardReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No reports found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              dashboardReports.map((report) => (
                <TableRow key={report.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="pl-6 font-medium truncate max-w-[200px]">
                    {report.title}
                  </TableCell>
                  <TableCell className="truncate max-w-[150px]">{report.location}</TableCell>
                  <TableCell>
                    <Badge variant={
                      report.status === 'completed' ? 'success' : 
                      report.status === 'pending' ? 'warning' : 'info'
                    }>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      report.priority === 'high' ? 'destructive' : 
                      report.priority === 'medium' ? 'info' : 'secondary'
                    }>
                      {report.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6 text-muted-foreground text-xs">
                    {formatDate(report.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
