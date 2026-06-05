import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { reportsAPI, uploadAPI } from '@/lib/api'
import { DashboardMapPreview } from '@/components/dashboard/DashboardMapPreview'
import { useToastStore } from '@/stores/toastStore'
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Navigation, 
  Camera,
  RefreshCw,
  Layers,
  FileText,
  AlertTriangle,
  MoreVertical,
  CheckCircle,
  History,
  TrendingUp,
  ExternalLink,
  PackageCheck
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatDistanceToNow, parseISO } from 'date-fns'
import type { Report } from '@/types'
import { cn } from '@/utils'

interface AssignedRoute {
  route: Array<{ id: string; title?: string; latitude?: number; longitude?: number }>
  geometry?: any
  fallback?: boolean
  total: number
}

export function CollectorDashboard() {
  const user = useAuthStore((state) => state.user)
  const { addToast } = useToastStore()
  
  const [reports, setReports] = useState<Report[]>([])
  const [routeData, setRouteData] = useState<AssignedRoute | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [completionModalOpen, setCompletionModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [completionFile, setCompletionFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const [reportsRes, routeRes] = await Promise.all([
        reportsAPI.getAssignedReports(),
        reportsAPI.getAssignedRoute(),
      ])
      setReports(reportsRes.data || [])
      setRouteData(routeRes.data || null)
    } catch (err: any) {
      console.error('Collector dashboard load failed:', err)
      addToast(err?.response?.data?.error || 'Failed to load collector dashboard', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  const stats = useMemo(() => {
    return {
      total: reports.length,
      inProgress: reports.filter((r) => r.status === 'in_progress').length,
      pending: reports.filter((r) => r.status === 'pending').length,
      completed: reports.filter((r) => r.status === 'completed').length,
      urgent: reports.filter(r => r.priority === 'high').length
    }
  }, [reports])

  const handleStart = async (reportId: string) => {
    setActionLoading(reportId + '-start')
    try {
      await reportsAPI.startReport(reportId)
      addToast('Task marked as In Progress', 'success')
      await fetchDashboard()
    } catch (err: any) {
      addToast('Failed to start task', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCompletionUpload = async () => {
    if (!selectedReport || !completionFile) return
    setActionLoading(selectedReport.id + '-complete')
    try {
      const response = await uploadAPI.uploadImage(completionFile, (progress) => {
        setUploadProgress(progress)
      })
      await reportsAPI.completeReport(selectedReport.id, response.data.url)
      addToast('Task resolved and verified', 'success')
      setCompletionModalOpen(false)
      setSelectedReport(null)
      setCompletionFile(null)
      setUploadProgress(0)
      await fetchDashboard()
    } catch (err: any) {
      addToast('Failed to complete report', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="success">Completed</Badge>
      case 'in_progress': return <Badge variant="info">In Progress</Badge>
      case 'pending': return <Badge variant="warning">Pending</Badge>
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground font-medium">Syncing field data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 pb-12">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Collector Terminal</h1>
            <p className="text-muted-foreground">Manage your assigned waste collection missions.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Operations
            </div>
            <Button variant="outline" size="icon" onClick={fetchDashboard} disabled={loading}>
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-none shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Layers size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">My Tasks</p>
                  <h3 className="text-2xl font-bold">{stats.total}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  <Activity size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <h3 className="text-2xl font-bold">{stats.inProgress}</h3>
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
                  <h3 className="text-2xl font-bold">{stats.completed}</h3>
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

        <div className="flex flex-col gap-8">
          {/* Assignments Table */}
          <Card className="border-none shadow-soft overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Active Assignments</CardTitle>
                  <CardDescription>Directives assigned by the command center.</CardDescription>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <PackageCheck size={18} />
                </div>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <History size={48} className="mb-4 opacity-20" />
                          <p className="text-lg font-medium">Queue Clear</p>
                          <p className="text-sm">No active assignments at this time.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((report) => (
                      <TableRow key={report.id} className="group hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">{report.location}</span>
                            <span className="text-xs text-muted-foreground line-clamp-1">{report.description}</span>
                          </div>
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
                          <div className="flex items-center justify-end gap-2">
                            {report.status === 'pending' && (
                              <Button 
                                size="sm" 
                                className="h-8 gap-2 bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleStart(report.id)}
                                disabled={!!actionLoading}
                              >
                                <Navigation size={14} />
                                Engage
                              </Button>
                            )}
                            {report.status !== 'completed' && (
                              <Button 
                                size="sm" 
                                className="h-8 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => {
                                  setSelectedReport(report)
                                  setCompletionModalOpen(true)
                                }}
                                disabled={!!actionLoading}
                              >
                                <CheckCircle size={14} />
                                Resolve
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem className="gap-2">
                                  <ExternalLink size={14} /> Open in Maps
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                                  <AlertTriangle size={14} /> Report Issue
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Navigation/Map Card */}
          <div className="grid gap-8 lg:grid-cols-3">
            <Card className="lg:col-span-2 border-none shadow-soft overflow-hidden h-fit">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <Navigation className="text-primary" size={18} />
                  <CardTitle className="text-lg">Tactical Map</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[500px] w-full relative">
                  <DashboardMapPreview 
                    reports={reports} 
                    routeData={routeData} 
                    fetchAll={false} 
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-soft bg-slate-900 text-white h-fit">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-emerald-400" size={18} />
                  <CardTitle className="text-lg">Fleet Performance</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                    <span>Route Completion</span>
                    <span>{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
                  </div>
                  <Progress 
                    value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0} 
                    className="h-2 bg-slate-800" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Time</p>
                    <p className="text-xl font-bold mt-1">14m</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Efficiency</p>
                    <p className="text-xl font-bold mt-1 text-emerald-400">High</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Resolve Task Dialog */}
      <Dialog open={completionModalOpen} onOpenChange={setCompletionModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight">Mission Resolution</DialogTitle>
            <DialogDescription>
              Upload photographic evidence to verify the resolution of this waste report.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="p-4 rounded-xl bg-muted/50 border border-muted">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Target Location</p>
              <p className="font-semibold text-foreground">{selectedReport?.location}</p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Photographic Proof</label>
              <div className="relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-muted hover:border-primary transition-colors bg-muted/20">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setCompletionFile(event.target.files?.[0] ?? null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="p-12 flex flex-col items-center justify-center text-center">
                  <Camera className="text-muted-foreground w-12 h-12 mb-4 group-hover:text-primary transition-colors" />
                  <p className="text-sm font-bold text-foreground">
                    {completionFile ? completionFile.name : 'Select or Capture Image'}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-2">JPEG, PNG up to 10MB</p>
                </div>
              </div>
            </div>

            {uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-primary">Uploading Proof...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-1.5" />
              </div>
            )}
          </div>

          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="outline" onClick={() => setCompletionModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              className="flex-[2] gap-2" 
              onClick={handleCompletionUpload}
              disabled={!!actionLoading || !completionFile}
            >
              {actionLoading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Complete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

export default CollectorDashboard
