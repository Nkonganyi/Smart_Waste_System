import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { reportsAPI } from '@/lib/api'
import { useToastStore } from '@/stores/toastStore'
import { CitizenNavbar } from '@/components/CitizenNavbar'
import { formatDate } from '@/utils'
import type { Report } from '@/types'
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Image as ImageIcon,
  Sparkles,
  Activity,
  Plus,
  Clock,
  CheckCircle2,
  MapPin
} from 'lucide-react'

// --- Operational Stats Card ---
function DashMetric({
  label,
  value,
  icon: Icon,
  color = 'blue'
}: {
  label: string;
  value: number;
  icon: any;
  color?: 'emerald' | 'blue' | 'amber'
}) {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300',
  }

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 transition-all hover:shadow-lg hover:shadow-blue-500/5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className={`rounded-2xl p-3 ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

export function CitizenDashboard() {
  const user = useAuthStore((state) => state.user)
  const addToast = useToastStore((state) => state.addToast)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [isReturningVisitor, setIsReturningVisitor] = useState(false)

  useEffect(() => {
    const visited = window.localStorage.getItem('citizen_visited') === 'true'
    setIsReturningVisitor(visited)
    window.localStorage.setItem('citizen_visited', 'true')
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await reportsAPI.getMyReports()
      setReports(response.data || [])
    } catch (err: any) {
      console.error('Failed to fetch reports:', err)
      addToast(err?.response?.data?.error || 'Unable to load your reports.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const recentReports = useMemo(() => reports.slice(0, 3), [reports])
  const reportStatusCounts = useMemo(() => ({
    pending: reports.filter((report) => report.status === 'pending').length,
    inProgress: reports.filter((report) => report.status === 'in_progress').length,
    completed: reports.filter((report) => report.status === 'completed').length,
  }), [reports])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <CitizenNavbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">

        {/* HERO: Command Greeting */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 lg:p-12">
          {/* Decorative Grid */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
               style={{ backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

          <div className="relative grid gap-12 lg:grid-cols-[1.8fr_1fr] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-blue-200 bg-blue-50/50 px-4 py-1.5 dark:border-blue-500/20 dark:bg-blue-500/10">
                <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400">
                  Citizen Intelligence Node
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
                  {isReturningVisitor ? 'Welcome back' : 'Good day'}, <br />
                  <span className="text-emerald-600 dark:text-emerald-400">{user?.name?.split(' ')[0] ?? 'neighbor'}</span>
                </h1>
                <p className="max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                  Your contributions directly impact city-wide sustainability.
                  Monitor your active reports or deploy a new signal for waste collection.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/citizen/report"
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-blue-500/20 transition hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5" />
                  <span>New Signal</span>
                </Link>
                <Link
                  to="/citizen/reports"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-8 py-4 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Archive View
                </Link>
              </div>
            </div>

            {/* Side Card: City Info */}
            <div className="relative rounded-[2rem] border border-slate-100 bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-blue-600 p-3 shadow-lg shadow-blue-500/20">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Resource Optimization</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    Did you know? Reports with accurate photos are resolved 30% faster by field crews.
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium">Zone Efficiency</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">High</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Next Collection</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Tomorrow</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS OVERVIEW */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DashMetric label="Active Signals" value={reports.length} icon={Activity} color="blue" />
          <DashMetric label="Pending Review" value={reportStatusCounts.pending} icon={Clock} color="amber" />
          <DashMetric label="Successfully Resolved" value={reportStatusCounts.completed} icon={CheckCircle2} color="emerald" />
        </section>

        {/* MAIN CONTENT GRID */}
        <section className="grid gap-8 lg:grid-cols-[1fr_350px]">

          {/* LATEST RECORDS */}
          <article className="rounded-[2.5rem] bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <div className="flex items-center justify-between gap-4 mb-10">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Operational Log</h2>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Recent Submissions</h3>
              </div>
              {reports.length > 3 && (
                <Link
                  to="/citizen/reports"
                  className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View full history <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 animate-pulse rounded-[1.75rem] bg-slate-100 dark:bg-slate-800" />
                ))}
              </div>
            ) : recentReports.length === 0 ? (
              <div className="rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 p-16 text-center dark:border-slate-800">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <ImageIcon className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">No active signals</h3>
                <p className="mt-2 text-slate-500 max-w-xs mx-auto">Spotted something? Your reports help the city allocate resources effectively.</p>
                <Link
                  to="/citizen/report"
                  className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-3 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  Issue New Signal
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {recentReports.map((report) => (
                  <div key={report.id} className="group relative overflow-hidden rounded-[1.75rem] border border-slate-100 bg-slate-50/30 p-6 transition-all hover:border-blue-100 hover:bg-white dark:border-slate-800 dark:bg-slate-800/30 dark:hover:bg-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-700">
                        {report.image_url ? (
                          <img src={report.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-slate-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <h4 className="truncate text-lg font-bold text-slate-900 dark:text-white">{report.location}</h4>
                          <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            report.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            report.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {report.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase text-slate-400">Title</p>
                            <p className="truncate text-xs font-medium text-slate-600 dark:text-slate-300">{report.title || 'Untitled'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase text-slate-400">Timestamp</p>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{formatDate(report.created_at)}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase text-slate-400">Priority</p>
                            <p className="text-xs font-medium capitalize text-slate-600 dark:text-slate-300">{report.priority}</p>
                          </div>
                          <div className="flex items-end justify-end">
                             <Link to={`/citizen/reports/${report.id}`} className="p-2 rounded-full bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-700 text-slate-400 hover:text-blue-600">
                               <ArrowRight className="h-4 w-4" />
                             </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          {/* SIDEBAR */}
          <aside className="space-y-6">

            {/* SCHEDULE */}
            <div className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-xl shadow-slate-200/50 dark:shadow-none">
              <div className="flex items-center gap-3 mb-8">
                <CalendarDays className="h-5 w-5 text-emerald-400" />
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Collection Schedule</p>
              </div>

              <div className="space-y-6">
                <div className="relative pl-6 before:absolute before:left-0 before:top-1 before:h-full before:w-[2px] before:bg-slate-800">
                  <p className="text-xs font-bold text-emerald-400 uppercase mb-1">General Waste</p>
                  <p className="text-sm font-medium">Mon, Wed, Fri</p>
                </div>
                <div className="relative pl-6 before:absolute before:left-0 before:top-1 before:h-full before:w-[2px] before:bg-slate-800">
                  <p className="text-xs font-bold text-blue-400 uppercase mb-1">Recyclables</p>
                  <p className="text-sm font-medium">Tuesday</p>
                </div>
                <div className="relative pl-6 before:absolute before:left-0 before:top-1 before:h-full before:w-[2px] before:bg-slate-800">
                  <p className="text-xs font-bold text-amber-400 uppercase mb-1">Organic</p>
                  <p className="text-sm font-medium">Thursday</p>
                </div>
              </div>
            </div>

            {/* PROTOCOL */}
            <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center dark:bg-blue-900/20">
                  <ClipboardList className="h-4 w-4 text-blue-600" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white">Next Steps</h4>
              </div>
              <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Signals are reviewed by the municipal hub. Once assigned, you'll see real-time updates as field crews route to your location.
              </p>
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                 <div className="flex items-center gap-3">
                   <MapPin className="h-4 w-4 text-slate-400" />
                   <span className="text-xs font-medium text-slate-500">Local Precinct: Hub-04</span>
                 </div>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}
