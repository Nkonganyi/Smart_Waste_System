import { useState, useEffect, useMemo } from 'react'
import { reportsAPI } from '@/lib/api'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  MoreVertical, 
  Eye, 
  UserPlus, 
  CheckCircle2, 
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  Map as MapIcon,
  X,
  Calendar as CalendarIcon,
  ExternalLink
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { Report, User } from '@/types'
import { formatDate, cn } from '@/utils'
import { formatDistanceToNow, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useToastStore } from '@/stores/toastStore'

export function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [collectors, setCollectors] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [assigningCollector, setAssigningCollector] = useState<string>('')
  const [assignLoading, setAssignLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState<string | null>(null)
  
  const navigate = useNavigate()
  const { addToast } = useToastStore()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [reportsRes, collectorsRes] = await Promise.all([
        reportsAPI.getAllReports(),
        reportsAPI.getCollectors()
      ])
      setReports(reportsRes.data)
      setCollectors(collectorsRes.data)
    } catch (err) {
      console.error('Failed to fetch data:', err)
      addToast('Failed to load reports data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = 
        report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
  }, [reports, searchTerm, statusFilter, priorityFilter, startDate, endDate])

  const stats = useMemo(() => {
    return {
      total: reports.length,
      pending: reports.filter(r => r.status === 'pending').length,
      resolved: reports.filter(r => r.status === 'completed').length,
      urgent: reports.filter(r => r.priority === 'high').length
    }
  }, [reports])

  const handleStatusChange = async (reportId: string, newStatus: string) => {
    setStatusLoading(reportId + newStatus)
    try {
      await reportsAPI.updateStatus(reportId, newStatus)
      addToast(`Status updated to ${newStatus}`, 'success')
      await fetchData()
    } catch (err: any) {
      addToast(err?.response?.data?.error || 'Failed to update status', 'error')
    } finally {
      setStatusLoading(null)
    }
  }

  const handleAssign = async () => {
    if (!selectedReport || !assigningCollector) return
    setAssignLoading(true)
    try {
      await reportsAPI.assignCollector(selectedReport.id, assigningCollector)
      addToast('Collector assigned successfully', 'success')
      setIsAssignOpen(false)
      setSelectedReport(null)
      setAssigningCollector('')
      await fetchData()
    } catch (err: any) {
      addToast(err?.response?.data?.error || 'Failed to assign collector', 'error')
    } finally {
      setAssignLoading(false)
    }
  }

  // Standardized badge rendering for status/priority
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="success">Completed</Badge>
      case 'in_progress': return <Badge variant="info">In Progress</Badge>
      case 'pending': return <Badge variant="warning">Pending</Badge>
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>
      default: return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive">High</Badge>
      case 'medium': return <Badge variant="warning">Medium</Badge>
      case 'low': return <Badge variant="success">Low</Badge>
      default: return <Badge variant="secondary">{priority}</Badge>
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports Management</h1>
            <p className="text-muted-foreground">Monitor and process waste reports across the city.</p>
          </div>
          <Button onClick={() => navigate('/admin/routes')} className="gap-2">
            <MapIcon size={18} />
            View Map
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-none shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <FileText size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Reports</p>
                  <h3 className="text-2xl font-bold">{stats.total}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <h3 className="text-2xl font-bold">{stats.pending}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                  <h3 className="text-2xl font-bold">{stats.resolved}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Urgent</p>
                  <h3 className="text-2xl font-bold">{stats.urgent}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-soft">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by ID, location, or title..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant={showFilters ? "secondary" : "outline"} 
              className="gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              Filters
            </Button>
            {showFilters && (
              <Button variant="ghost" size="icon" onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setPriorityFilter('all')
                setStartDate('')
                setEndDate('')
                setShowFilters(false)
              }} aria-label="Reset filters">
                <X size={18} />
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-muted/30 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Resolved</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Priority</label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">From Date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    className="pl-10"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">To Date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    className="pl-10"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead className="min-w-[200px]">Report Details</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 w-12 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-10 w-full animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-4 w-32 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-6 w-20 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-6 w-20 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="ml-auto h-8 w-8 animate-pulse rounded bg-muted" /></TableCell>
                  </TableRow>
                ))
              ) : filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <FileText size={48} className="mb-4 opacity-20" />
                      <p className="text-lg font-medium">No reports found</p>
                      <p className="text-sm">Try adjusting your filters or search terms.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((report) => (
                  <TableRow key={report.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{report.id.substring(0, 6)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {report.image_url ? (
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-muted">
                            <img src={report.image_url} alt="" className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted">
                            <FileText size={18} className="text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex flex-col overflow-hidden">
                          <span className="font-semibold text-foreground truncate">{report.title}</span>
                          <span className="text-xs text-muted-foreground truncate">{report.description}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {report.location}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(report.status)}
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(report.priority)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(parseISO(report.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical size={18} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => {
                            setSelectedReport(report)
                            setIsDetailsOpen(true)
                          }}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedReport(report)
                            setIsAssignOpen(true)
                          }}>
                            <UserPlus className="mr-2 h-4 w-4" /> Assign Collector
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(report.id, 'in_progress')}
                            disabled={statusLoading === report.id + 'in_progress' || report.status === 'completed'}
                            aria-disabled={statusLoading === report.id + 'in_progress' || report.status === 'completed'}
                          >
                            {statusLoading === report.id + 'in_progress' ? (
                              <span className="mr-2 h-4 w-4 animate-spin"><Clock className="h-4 w-4" /></span>
                            ) : (
                              <Clock className="mr-2 h-4 w-4" />
                            )}
                            Set In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-emerald-600 focus:text-emerald-600" 
                            onClick={() => handleStatusChange(report.id, 'completed')}
                            disabled={statusLoading === report.id + 'completed' || report.status === 'completed'}
                            aria-disabled={statusLoading === report.id + 'completed' || report.status === 'completed'}
                          >
                            {statusLoading === report.id + 'completed' ? (
                              <span className="mr-2 h-4 w-4 animate-spin"><CheckCircle2 className="h-4 w-4" /></span>
                            ) : (
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                            )}
                            Mark Completed
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              Report Details
              {selectedReport && getStatusBadge(selectedReport.status)}
            </DialogTitle>
            <DialogDescription>
              Report ID: {selectedReport?.id}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-full max-h-[60vh] pr-4">
            <div className="grid gap-8 py-4">
              {selectedReport?.image_url && (
                <div className="w-full aspect-video rounded-xl overflow-hidden border bg-muted">
                  <img src={selectedReport.image_url} alt={selectedReport.title} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Description</h4>
                    <p className="text-foreground leading-relaxed">{selectedReport?.description}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Location</h4>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border">
                      <MapIcon className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{selectedReport?.location}</p>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="h-auto p-0 text-primary mt-1 gap-1"
                          onClick={() => navigate('/admin/routes')}
                        >
                          View on map <ExternalLink size={12} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Timeline</h4>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                          <div className="w-0.5 flex-1 bg-border my-1" />
                        </div>
                        <div className="pb-4">
                          <p className="text-sm font-bold">Report Created</p>
                          <p className="text-xs text-muted-foreground">
                            {selectedReport && formatDate(selectedReport.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={cn("h-2.5 w-2.5 rounded-full", selectedReport?.collector_id ? "bg-primary" : "bg-muted border")} />
                          <div className="w-0.5 flex-1 bg-border my-1" />
                        </div>
                        <div className="pb-4">
                          <p className={cn("text-sm font-bold", !selectedReport?.collector_id && "text-muted-foreground")}>Collector Assigned</p>
                          <p className="text-xs text-muted-foreground">
                            {selectedReport?.collector_id ? 'Assigned to collector' : 'Awaiting assignment'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={cn("h-2.5 w-2.5 rounded-full", selectedReport?.status === 'completed' ? "bg-primary" : "bg-muted border")} />
                        </div>
                        <div>
                          <p className={cn("text-sm font-bold", selectedReport?.status !== 'completed' && "text-muted-foreground")}>Report Resolved</p>
                          <p className="text-xs text-muted-foreground">
                            {selectedReport?.status === 'completed' ? 'Marked as resolved' : 'In progress'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button>
            <Button onClick={() => {
              setIsDetailsOpen(false)
              setIsAssignOpen(true)
            }}>Assign Collector</Button>
            {selectedReport?.status !== 'completed' && (
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleStatusChange(selectedReport!.id, 'completed')}>
                Mark as Resolved
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Modal */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Collector</DialogTitle>
            <DialogDescription>
              Choose a collector to handle report #{selectedReport?.id.substring(0, 6)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Select Collector
            </label>
            <Select value={assigningCollector} onValueChange={setAssigningCollector}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a collector..." />
              </SelectTrigger>
              <SelectContent>
                {collectors.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">No active collectors available</div>
                ) : (
                  collectors.map(collector => (
                    <SelectItem key={collector.id} value={collector.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{collector.name}</span>
                        <span className="text-xs text-muted-foreground">{collector.email}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!assigningCollector || assignLoading} aria-busy={assignLoading}>
              {assignLoading ? (
                <span className="flex items-center gap-2"><span className="animate-spin h-4 w-4"><CheckCircle2 className="h-4 w-4" /></span>Assigning...</span>
              ) : 'Confirm Assignment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
