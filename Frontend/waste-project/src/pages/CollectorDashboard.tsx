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
  Shield, 
  AlertCircle, 
  Camera,
  LogOut,
  ChevronRight,
  Globe,
  Trash2,
  RefreshCw,
  Layers,
  LayoutDashboard,
  Search,
  Bell,
  Calendar,
  Filter,
  Download,
  MoreVertical,
  X,
  Truck
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import type { Report } from '@/types'

interface AssignedRoute {
  route: Array<{ id: string; title?: string; latitude?: number; longitude?: number }>
  geometry?: any
  fallback?: boolean
  total: number
}

export function CollectorDashboard() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const { addToast } = useToastStore()
  const location = useLocation()
  
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
    }
  }, [reports])

  const handleStart = async (reportId: string) => {
    setActionLoading(reportId + '-start')
    try {
      await reportsAPI.startReport(reportId)
      addToast('Mission started', 'success')
      await fetchDashboard()
    } catch (err: any) {
      addToast('Failed to start report', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const openCompletionModal = (report: Report) => {
    setSelectedReport(report)
    setCompletionModalOpen(true)
    setCompletionFile(null)
    setUploadProgress(0)
  }

  const handleRejectAssignment = async (reportId: string) => {
    setActionLoading(reportId + '-reject')
    try {
      await reportsAPI.rejectAssignment(reportId)
      addToast('Assignment rejected', 'success')
      await fetchDashboard()
    } catch (err: any) {
      addToast('Failed to reject assignment', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleGeocode = async (reportId: string, locationText: string) => {
    setActionLoading(reportId + '-geo')
    try {
      const resp = await reportsAPI.geocodeLocation(locationText)
      const { latitude, longitude } = resp.data || {}
      if (!latitude || !longitude) {
        addToast('Could not resolve coordinates', 'warning')
        return
      }
      await reportsAPI.updateReportCoords(reportId, latitude, longitude)
      addToast('Coordinates updated', 'success')
      await fetchDashboard()
    } catch (err: any) {
      addToast('Failed to geocode location', 'error')
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
      addToast('Task resolved successfully', 'success')
      setCompletionModalOpen(false)
      await fetchDashboard()
    } catch (err: any) {
      addToast('Failed to complete report', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const sidebarLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/collector', active: true },
    { name: 'Deliveries', icon: Truck, path: '#' },
    { name: 'Reports', icon: Activity, path: '#' },
    { name: 'Navigation', icon: Navigation, path: '#' },
    { name: 'Settings', icon: Shield, path: '#' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium text-sm">Loading field terminal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-slate-900">
      {/* SIDEBAR - Inspired by Reference */}
      <aside className="w-64 bg-[#3f51b5] text-white flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Truck className="text-[#3f51b5] w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">EcoSync</h1>
            <p className="text-[10px] text-white/60 font-medium tracking-widest uppercase">Field Logistics</p>
          </div>
        </div>

        <nav className="flex-grow py-6">
          <ul className="space-y-1">
            {sidebarLinks.map((link) => (
              <li key={link.name}>
                <a 
                  href={link.path}
                  className={`flex items-center gap-4 px-6 py-3 transition-all ${
                    link.active 
                      ? 'bg-white/15 border-l-4 border-white font-bold' 
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <link.icon size={20} />
                  <span className="text-sm">{link.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-6">
          <div className="bg-white/10 rounded-xl p-4 space-y-4">
            <p className="text-xs font-medium text-white/80 leading-relaxed">Deliver faster with real-time tracking</p>
            <button className="w-full bg-white text-[#3f51b5] py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors">
              Track Now <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow flex flex-col min-w-0 overflow-hidden">
        {/* TOP BAR - Inspired by Reference */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center bg-slate-100 rounded-lg px-4 py-2 w-96">
            <Search size={18} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search reports, locations, orders..." 
              className="bg-transparent border-none focus:ring-0 text-sm ml-3 w-full placeholder:text-slate-400"
            />
            <span className="text-[10px] font-bold text-slate-400 border border-slate-300 rounded px-1.5 ml-2">Ctrl + K</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer">
              <Calendar size={16} />
              <span className="text-sm font-medium">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <ChevronRight size={14} className="rotate-90" />
            </div>
            <div className="relative cursor-pointer">
              <Bell size={20} className="text-slate-600" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">2</span>
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900 leading-none">{user?.name}</p>
                <p className="text-[10px] font-medium text-slate-500 mt-1">Field Collector</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center border border-indigo-200 overflow-hidden">
                <img src={`https://ui-avatars.com/api/?name=${user?.name}&background=6366f1&color=fff`} alt="User" />
              </div>
              <button onClick={() => logout()} className="text-slate-400 hover:text-rose-500 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <div className="p-8 overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Dashboard</h2>
              <p className="text-slate-500 text-sm mt-1">Overview of your logistics operations</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 flex items-center gap-3 text-sm font-medium text-slate-600 cursor-pointer">
                <Calendar size={16} />
                This Week
                <ChevronRight size={14} className="rotate-90" />
              </div>
            </div>
          </div>

          {/* STATS ROW - Inspired by Reference Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Total Assignments', value: stats.total, change: '+10%', trend: 'up', icon: Layers, color: 'indigo' },
              { label: 'In Progress', value: stats.inProgress, change: '+6%', trend: 'up', icon: Activity, color: 'emerald' },
              { label: 'Pending Tasks', value: stats.pending, change: '-10%', trend: 'down', icon: Clock, color: 'amber' },
              { label: 'Completed', value: stats.completed, change: '+18%', trend: 'up', icon: CheckCircle2, color: 'indigo' },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                    stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    <stat.icon size={24} />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                  <span className={`flex items-center gap-1 text-xs font-bold ${stat.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {stat.trend === 'up' ? '↑' : '↓'} {stat.change}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">vs last week</span>
                  <div className="flex-grow h-8 ml-2 opacity-30">
                    <svg viewBox="0 0 100 40" className="w-full h-full preserve-3d">
                      <path 
                        d="M0,35 Q20,30 40,35 T80,10 T100,20" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3" 
                        className={stat.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}
                      />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RECENT DELIVERIES TABLE - Inspired by Reference */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-3">
                <LayoutDashboard size={20} className="text-indigo-600" />
                Recent Assignments
              </h3>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                  <Filter size={14} /> Filter
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors">
                  <Download size={14} /> Export
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#f0f4ff] text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Report ID</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Report Date</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center opacity-30">
                          <Truck size={48} className="mb-4" />
                          <p className="font-bold uppercase tracking-widest text-xs">No assignments active</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-indigo-600 border-b border-indigo-200 cursor-pointer">
                            REP-{report.id.slice(0, 5).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            report.priority === 'high' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'
                          }`}>
                            {report.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                            <MapPin size={14} className="text-slate-400" />
                            {report.location}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              report.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                              report.status === 'in_progress' ? 'bg-indigo-100 text-indigo-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                report.status === 'completed' ? 'bg-emerald-500' :
                                report.status === 'in_progress' ? 'bg-indigo-500 animate-pulse' :
                                'bg-amber-500'
                              }`} />
                              {report.status.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-medium text-slate-700">
                            {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            <p className="text-[10px] text-slate-400 mt-0.5">{new Date(report.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {report.status === 'pending' && (
                              <button 
                                onClick={() => handleStart(report.id)}
                                className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                title="Start Task"
                              >
                                <Navigation size={16} />
                              </button>
                            )}
                            {report.status !== 'completed' && (
                              <button 
                                onClick={() => openCompletionModal(report)}
                                className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                title="Resolve Task"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                            )}
                            <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                              <MoreVertical size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">Showing 1 to {reports.length} of {reports.length} entries</p>
              <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <ChevronRight size={18} className="rotate-180" />
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold">1</button>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 text-xs font-bold hover:bg-slate-100 transition-colors">2</button>
                <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
          
          {/* MAP PREVIEW - Full Width Bottom Section */}
          <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-3">
                  <Navigation size={20} className="text-indigo-600" />
                  Field Navigation
                </h3>
             </div>
             <div className="h-[400px] relative">
               <DashboardMapPreview reports={reports} routeData={routeData} fetchAll={false} />
             </div>
          </div>
        </div>
      </main>

      {/* COMPLETION MODAL */}
      {completionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Resolve Task</h2>
                <p className="mt-1 text-slate-500 text-sm">Upload photographic proof to close this report.</p>
              </div>
              <button
                onClick={() => setCompletionModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-900 transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Site</p>
                <p className="text-sm font-bold text-slate-900">{selectedReport?.location}</p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Resolution Proof</label>
                <div className="relative group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setCompletionFile(event.target.files?.[0] ?? null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="p-10 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center group-hover:bg-white group-hover:border-indigo-300 transition-all">
                    <Camera className="text-slate-300 w-12 h-12 mb-4 group-hover:text-indigo-400 transition-colors" />
                    <p className="text-sm font-bold text-slate-600">{completionFile ? completionFile.name : 'Select or drop image'}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-2">JPG, PNG up to 10MB</p>
                  </div>
                </div>
              </div>

              {uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Uploading Signal</span>
                    <span className="text-[10px] font-bold text-slate-900">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-10 flex gap-4">
              <button
                type="button"
                onClick={() => setCompletionModalOpen(false)}
                className="flex-1 h-12 rounded-lg border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompletionUpload}
                disabled={Boolean(actionLoading)}
                className="flex-[2] h-12 rounded-lg bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Submit Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CollectorDashboard
