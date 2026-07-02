import { useEffect, useState } from 'react'
import { useToastStore } from '@/stores/toastStore'
import { reportsAPI } from '@/lib/api'
import { CitizenNavbar } from '@/components/CitizenNavbar'
import { ReportDetailModal } from '@/components/ReportDetailModal'
import { formatDate } from '@/utils'
import type { Report } from '@/types'
import { Image as ImageIcon, Search, GitMerge } from 'lucide-react'

type StatusFilter = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'

const STATUS_LABEL: Record<StatusFilter, string> = {
  all: 'All', pending: 'Pending', in_progress: 'In Progress',
  completed: 'Completed', cancelled: 'Cancelled',
}

const STATUS_CARD_STYLE: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
  in_progress: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200',
  cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
}

export function CitizenReportsPage() {
  const addToast = useToastStore((s) => s.addToast)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all')

  useEffect(() => {
    reportsAPI.getMyReports()
      .then((res) => setReports(res.data || []))
      .catch((err: any) => addToast(err?.response?.data?.error || 'Unable to load your reports.', 'error'))
      .finally(() => setLoading(false))
  }, [addToast])

  const filtered = reports.filter((r) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      r.title?.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <CitizenNavbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">My Reports</h1>
          <p className="mt-2 text-sm text-slate-500">
            {loading ? 'Loading…' : `${reports.length} report${reports.length !== 1 ? 's' : ''} submitted`}
          </p>
        </section>

        {/* Search + Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, location, or description…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm placeholder-slate-400 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-emerald-200/20"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(STATUS_LABEL) as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  filterStatus === s
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-600 dark:bg-slate-800">
            <ImageIcon className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold">No reports found</h3>
            <p className="mt-2 text-sm text-slate-500">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your search or filters.'
                : "You haven't submitted any reports yet."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((report) => (
              <button
                key={report.id}
                onClick={() => { setSelectedReport(report); setIsModalOpen(true) }}
                className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-left"
              >
                {/* Thumbnail */}
                <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-700">
                  {report.image_url ? (
                    <img src={report.image_url} alt={report.title} className="h-full w-full object-cover group-hover:scale-105 transition duration-300" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-slate-400" />
                    </div>
                  )}
                  <div className="absolute right-3 top-3">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${STATUS_CARD_STYLE[report.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {report.status.replace('_', ' ')}
                    </span>
                  </div>
                  {report.parent_report_id && (
                    <div className="absolute left-3 top-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                        <GitMerge size={11} /> Linked
                      </span>
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {report.title || 'Untitled'}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">{report.location}</p>
                  </div>
                  <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{report.description}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-400">{formatDate(report.created_at)}</span>
                    <span className={`text-xs font-bold capitalize px-2 py-0.5 rounded-full ${
                      report.priority === 'high' ? 'text-rose-600 bg-rose-50 dark:bg-rose-500/10' :
                      report.priority === 'medium' ? 'text-orange-600 bg-orange-50 dark:bg-orange-500/10' :
                      'text-slate-500 bg-slate-100 dark:bg-slate-700'
                    }`}>
                      {report.priority}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      <ReportDetailModal
        report={selectedReport}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedReport(null) }}
      />
    </div>
  )
}
