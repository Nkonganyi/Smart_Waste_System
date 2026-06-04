import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { reportsAPI } from '@/lib/api'
import { useToastStore } from '@/stores/toastStore'
import { CitizenNavbar } from '@/components/CitizenNavbar'
import { ReportDetailModal } from '@/components/ReportDetailModal'
import { formatDate } from '@/utils'
import type { Report } from '@/types'
import { Image as ImageIcon, Search } from 'lucide-react'

export function CitizenReportsPage() {
  const user = useAuthStore((state) => state.user)
  const addToast = useToastStore((state) => state.addToast)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all')

  useEffect(() => {
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

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filterStatus === 'all' || report.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const openReportDetail = (report: Report) => {
    setSelectedReport(report)
    setIsModalOpen(true)
  }

  const closeReportDetail = () => {
    setIsModalOpen(false)
    setSelectedReport(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <CitizenNavbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <section className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            All Reports
          </h1>
          <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
            View and manage all your waste reports in one place.
          </p>
        </section>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, location, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-500 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:border-emerald-400 dark:focus:ring-emerald-200/20"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'in_progress', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  filterStatus === status
                    ? 'bg-emerald-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {status === 'all' ? 'All Reports' : status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Reports Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse rounded-xl bg-slate-200 p-6 dark:bg-slate-800" style={{ height: '300px' }} />
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-600 dark:bg-slate-800">
            <ImageIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">No reports found</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {searchQuery || filterStatus !== 'all' ? 'Try adjusting your search or filters.' : 'You haven\'t submitted any reports yet.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredReports.map((report) => (
              <button
                key={report.id}
                onClick={() => openReportDetail(report)}
                className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 text-left"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-700">
                  {report.image_url ? (
                    <img src={report.image_url} alt={report.location} className="h-full w-full object-cover group-hover:scale-105 transition" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-slate-400" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute right-3 top-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        report.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                          : report.status === 'in_progress'
                            ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200'
                      }`}
                    >
                      {report.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      {report.title || 'Untitled'}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{report.location}</p>
                  </div>

                  <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{report.description}</p>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(report.created_at)}</span>
                    <span className="text-xs font-semibold capitalize text-emerald-600 dark:text-emerald-400">{report.priority}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Report Detail Modal */}
      <ReportDetailModal report={selectedReport} isOpen={isModalOpen} onClose={closeReportDetail} />
    </div>
  )
}
