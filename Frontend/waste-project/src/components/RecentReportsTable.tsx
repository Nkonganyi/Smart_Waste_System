import { useEffect, useState } from 'react'
import { reportsAPI } from '@/lib/api'
import { ChevronRight } from 'lucide-react'

interface Report {
  id: string
  location: string
  description: string
  priority: string
  status: string
  created_at: string
  image_url?: string
}

export function RecentReportsTable() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        // Try to fetch all reports (admin endpoint)
        // If that fails (not admin), fall back to user's own reports
        try {
          const response = await reportsAPI.getAllReports()
          setReports(response.data?.slice(0, 5) || [])
        } catch (adminError) {
          // Fallback to user's own reports if getAllReports fails
          const response = await reportsAPI.getMyReports()
          setReports(response.data?.slice(0, 5) || [])
        }
      } catch (err) {
        console.error('Failed to fetch reports:', err)
        setError('Failed to load reports')
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600'
      case 'normal':
        return 'text-blue-600'
      case 'low':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>
  }

  if (error) {
    return <div className="h-64 flex items-center justify-center text-red-500">{error}</div>
  }

  if (!reports || reports.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-400">No reports available</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Priority</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {reports.map((report) => (
            <tr key={report.id} className="hover:bg-gray-50 transition">
              <td className="px-6 py-3 text-sm font-medium text-gray-900">{report.location}</td>
              <td className="px-6 py-3 text-sm text-gray-600 truncate max-w-xs">{report.description}</td>
              <td className="px-6 py-3 text-sm">
                <span className={`font-semibold uppercase text-xs ${getPriorityColor(report.priority)}`}>
                  {report.priority}
                </span>
              </td>
              <td className="px-6 py-3 text-sm">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                  {report.status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-6 py-3 text-sm text-gray-600">
                {new Date(report.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-3 text-sm">
                <button className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition">
                  View <ChevronRight size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
