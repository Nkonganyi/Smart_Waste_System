import { useEffect, useState } from 'react'
import { reportsAPI } from '@/lib/api'
import { ChevronRight } from 'lucide-react'

interface Report {
  id: string
  title?: string
  location: string
  description: string
  priority: string
  status: string
  created_at: string
}

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-800',
  in_progress: 'bg-blue-100 text-blue-800',
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-purple-100 text-purple-800',
  rejected: 'bg-red-100 text-red-700',
}

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-500',
  normal: 'bg-blue-400',
  low: 'bg-emerald-400',
}

export function RecentReportsTable() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        try {
          const res = await reportsAPI.getAllReports()
          setReports(res.data?.slice(0, 5) || [])
        } catch {
          const res = await reportsAPI.getMyReports()
          setReports(res.data?.slice(0, 5) || [])
        }
      } catch {
        setError('Failed to load reports')
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [])

  if (loading) return <div className="h-52 flex items-center justify-center text-sm text-gray-400">Loading…</div>
  if (error) return <div className="h-52 flex items-center justify-center text-sm text-red-400">{error}</div>
  if (!reports.length) return <div className="h-52 flex items-center justify-center text-sm text-gray-400">No reports yet</div>

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60">
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Location</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Description</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Priority</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Date</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {reports.map((report) => (
            <tr key={report.id} className="hover:bg-gray-50/70 transition-colors">
              <td className="px-5 py-3.5 text-sm font-medium text-gray-900 whitespace-nowrap">
                {report.title || report.location}
                {report.title && (
                  <p className="text-xs text-gray-400 font-normal mt-0.5">{report.location}</p>
                )}
              </td>
              <td className="px-5 py-3.5 text-sm text-gray-500 hidden md:table-cell max-w-xs">
                <span className="line-clamp-1">{report.description}</span>
              </td>
              <td className="px-5 py-3.5 text-sm">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[report.priority] ?? 'bg-gray-300'}`} />
                  <span className="text-xs font-semibold text-gray-600 capitalize">{report.priority}</span>
                </span>
              </td>
              <td className="px-5 py-3.5 text-sm">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[report.status] ?? 'bg-gray-100 text-gray-700'}`}>
                  {report.status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-5 py-3.5 text-xs text-gray-400 hidden sm:table-cell whitespace-nowrap">
                {new Date(report.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </td>
              <td className="px-5 py-3.5">
                <button title="View report" className="text-emerald-600 hover:text-emerald-800 transition-colors flex items-center gap-0.5">
                  <ChevronRight size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
