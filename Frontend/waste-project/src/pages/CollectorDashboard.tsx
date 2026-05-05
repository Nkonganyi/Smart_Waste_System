import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { reportsAPI } from '@/lib/api'

interface Report {
  id: string
  location: string
  description: string
  priority: string
  status: string
  image_url?: string
  created_at: string
}

export function CollectorDashboard() {
  const user = useAuthStore((state) => state.user)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await reportsAPI.getAssignedReports()
        setReports(response.data)
      } catch (err) {
        console.error('Failed to fetch reports:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  const handleStatusUpdate = async (reportId: string, newStatus: string) => {
    try {
      await reportsAPI.updateStatus(reportId, newStatus)
      setReports(reports.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r)))
    } catch (err) {
      console.error('Failed to update report:', err)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Collector Dashboard</h1>
          <p className="mt-1 text-gray-600">Welcome, {user?.name}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Assigned Reports</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td className="px-6 py-4 text-sm text-gray-600">{report.location}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          report.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : report.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{report.priority}</td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {report.status !== 'completed' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(report.id, 'in_progress')}
                            className="text-blue-600 hover:underline"
                          >
                            Start
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(report.id, 'completed')}
                            className="text-green-600 hover:underline"
                          >
                            Complete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {reports.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">No assigned reports</div>
          )}
        </div>
      </div>
    </div>
  )
}
