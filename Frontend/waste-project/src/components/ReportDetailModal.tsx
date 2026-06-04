import { useEffect, useState } from 'react'
import { X, Image as ImageIcon, Calendar, MapPin, Zap } from 'lucide-react'
import type { Report } from '@/types'
import { formatDate } from '@/utils'

interface ReportDetailModalProps {
  report: Report | null
  isOpen: boolean
  onClose: () => void
}

export function ReportDetailModal({ report, isOpen, onClose }: ReportDetailModalProps) {
  const [imageIndex, setImageIndex] = useState(0)

  useEffect(() => {
    if (!isOpen) {
      setImageIndex(0)
    }
  }, [isOpen])

  if (!isOpen || !report) return null

  const images = report.image_urls || (report.image_url ? [report.image_url] : [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{report.title || 'Report Details'}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{report.location}</p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close modal"
          >
            <X className="h-6 w-6 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 px-6 py-6">
          {/* Image Gallery */}
          {images.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Photos</h3>
              <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <img
                  src={images[imageIndex]}
                  alt={`Report image ${imageIndex + 1}`}
                  className="h-96 w-full object-cover"
                />
              </div>
              {images.length > 1 && (
                <div className="flex justify-center gap-2">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setImageIndex(idx)}
                      className={`h-2 transition-all ${
                        idx === imageIndex
                          ? 'w-8 bg-emerald-600'
                          : 'w-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500'
                      }`}
                      aria-label={`View image ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Status</span>
            <span
              className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
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

          {/* Details Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Details</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">Location</span>
                </div>
                <p className="mt-2 font-semibold text-slate-900 dark:text-slate-100">{report.location}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Submitted</span>
                </div>
                <p className="mt-2 font-semibold text-slate-900 dark:text-slate-100">{formatDate(report.created_at)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium">Priority</span>
                </div>
                <p className="mt-2 font-semibold capitalize text-slate-900 dark:text-slate-100">{report.priority}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <ImageIcon className="h-4 w-4" />
                  <span className="font-medium">Report ID</span>
                </div>
                <p className="mt-2 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{report.id}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Description</h3>
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {report.description}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
