import { useEffect, useState } from 'react'
import { X, Image as ImageIcon, Calendar, MapPin, Zap, CheckCircle2, Copy, GitMerge } from 'lucide-react'
import type { Report } from '@/types'
import { formatDate } from '@/utils'

interface ReportDetailModalProps {
  report: Report | null
  isOpen: boolean
  onClose: () => void
}

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
  in_progress: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200',
  approved: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
  cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
}

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
  medium: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200',
  normal: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

export function ReportDetailModal({ report, isOpen, onClose }: ReportDetailModalProps) {
  const [imageIndex, setImageIndex] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isOpen) setImageIndex(0)
  }, [isOpen])

  // Trap ESC key
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen || !report) return null

  const images = report.image_urls?.length
    ? report.image_urls
    : report.image_url
    ? [report.image_url]
    : []

  const statusLabel = report.status.replace(/_/g, ' ')
  const statusStyle = STATUS_STYLES[report.status] ?? 'bg-slate-100 text-slate-600'
  const priorityStyle = PRIORITY_STYLES[report.priority] ?? 'bg-slate-100 text-slate-600'

  const copyId = () => {
    navigator.clipboard.writeText(report.id).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl dark:bg-slate-900">
        {/* ── Header ── */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex-1 min-w-0 pr-4">
            <h2 id="report-modal-title" className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
              {report.title || 'Report Details'}
            </h2>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                <MapPin size={13} />
                {report.location}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="space-y-6 px-6 py-6">
          {/* Duplicate notice */}
          {report.parent_report_id && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
              <GitMerge size={18} className="shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Duplicate Report</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  A similar report already exists nearby. This report is linked to it and will be resolved together.
                </p>
              </div>
            </div>
          )}

          {/* Image gallery */}
          {images.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Evidence Photos ({images.length})</h3>
              <div className="overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                <img
                  src={images[imageIndex]}
                  alt={`Report image ${imageIndex + 1}`}
                  className="h-80 w-full object-cover"
                />
              </div>
              {images.length > 1 && (
                <div className="flex items-center justify-center gap-2">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setImageIndex(idx)}
                      className={`rounded-full transition-all ${
                        idx === imageIndex
                          ? 'w-6 h-2.5 bg-emerald-600'
                          : 'w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600'
                      }`}
                      aria-label={`View image ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <div className="text-center text-slate-400">
                <ImageIcon className="mx-auto h-8 w-8 mb-2 opacity-40" />
                <p className="text-xs font-semibold">No photos submitted</p>
              </div>
            </div>
          )}

          {/* Status & Priority badges */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Status</span>
              <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold capitalize ${statusStyle}`}>
                {statusLabel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Priority</span>
              <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold capitalize ${priorityStyle}`}>
                {report.priority}
              </span>
            </div>
          </div>

          {/* Details grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Details</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailCard icon={<Calendar className="h-4 w-4" />} label="Submitted" value={formatDate(report.created_at)} />
              {report.completed_at && (
                <DetailCard icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} label="Resolved" value={formatDate(report.completed_at)} />
              )}
              <DetailCard icon={<MapPin className="h-4 w-4" />} label="Location" value={report.location} />
              {(report.latitude && report.longitude) && (
                <DetailCard
                  icon={<Zap className="h-4 w-4" />}
                  label="Coordinates"
                  value={`${Number(report.latitude).toFixed(5)}, ${Number(report.longitude).toFixed(5)}`}
                />
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Description</h3>
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {report.description}
            </p>
          </div>

          {/* Report ID */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Report ID</h3>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
              <span className="font-mono text-xs text-slate-600 dark:text-slate-400 truncate flex-1">{report.id}</span>
              <button
                onClick={copyId}
                className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        {icon}
        <span className="font-semibold">{label}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  )
}
