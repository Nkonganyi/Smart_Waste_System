import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { reportsAPI, uploadAPI } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { compressImage } from '@/utils'
import { CitizenNavbar } from '@/components/CitizenNavbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle, CheckCircle2, ImagePlus, MapPin, Sparkles, Globe, X, ChevronRight, Camera, Info, Loader2 } from 'lucide-react'

function formatBytes(bytes: number) {
  return `${Math.round(bytes / 1024)} KB`
}

export function CitizenReportForm() {
  const user = useAuthStore((state) => state.user)
  const addToast = useToastStore((state) => state.addToast)
  const navigate = useNavigate()

  const [location, setLocation] = useState('')
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<'low' | 'normal' | 'medium' | 'high'>('normal')
  const [description, setDescription] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [success, setSuccess] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([])
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [reportSubmitted, setReportSubmitted] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(3)
  const suggestionTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url))
      if (suggestionTimer.current) {
        window.clearTimeout(suggestionTimer.current)
      }
    }
  }, [previews])

  useEffect(() => {
    if (!location || location.length < 3) {
      setLocationSuggestions([])
      return
    }

    setSuggestionLoading(true)
    if (suggestionTimer.current) {
      window.clearTimeout(suggestionTimer.current)
    }

    suggestionTimer.current = window.setTimeout(async () => {
      try {
        const response = await reportsAPI.getLocationSuggestions(location)
        setLocationSuggestions(response.data || [])
      } catch (err) {
        console.error('Location suggestions failed:', err)
      } finally {
        setSuggestionLoading(false)
      }
    }, 300)
  }, [location])

  useEffect(() => {
    if (!reportSubmitted) return
    if (secondsLeft <= 0) {
      navigate('/citizen')
      return
    }

    const timer = window.setTimeout(() => setSecondsLeft((current) => current - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [secondsLeft, reportSubmitted, navigate])

  const selectedCount = selectedFiles.length

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    const acceptedFiles: File[] = []
    const nextPreviews: string[] = []
    const errors: string[] = []

    for (let i = 0; i < Math.min(files.length, 3); i += 1) {
      const file = files[i]
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        errors.push(`${file.name}: Unsupported file type.`)
        continue
      }
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: File must be smaller than 10MB.`)
        continue
      }

      try {
        const compressed = await compressImage(file, 10)
        acceptedFiles.push(compressed)
        nextPreviews.push(URL.createObjectURL(compressed))
      } catch (compressionError) {
        console.error('Compression error:', compressionError)
        errors.push(`${file.name}: Could not process file.`)
      }
    }

    if (errors.length > 0) {
      addToast(errors.join(' '), 'warning')
    }

    setSelectedFiles((existing) => [...existing, ...acceptedFiles].slice(0, 3))
    setPreviews((existing) => [...existing, ...nextPreviews].slice(0, 3))
    event.target.value = ''
  }

  const handleRemoveImage = (index: number) => {
    setSelectedFiles((files) => files.filter((_, idx) => idx !== index))
    setPreviews((urls) => {
      URL.revokeObjectURL(urls[index])
      return urls.filter((_, idx) => idx !== index)
    })
  }

  const errors = useMemo(() => ({
    title: !title.trim() ? 'Title is required.' : '',
    location: !location.trim() ? 'Location is required.' : '',
    description: !description.trim() ? 'Please describe the waste issue.' : '',
    images: selectedFiles.length === 0 ? 'Upload at least one photo of the issue.' : '',
    terms: !termsAccepted ? 'You must confirm the report accuracy.' : '',
    ...validationErrors,
  }), [description, location, selectedFiles.length, termsAccepted, title, validationErrors])

  const hasErrors = Object.values(errors).some((error) => error)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (hasErrors) {
      setValidationErrors(errors)
      addToast('Please fix the highlighted fields before submitting.', 'error')
      return
    }

    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      const uploadResponse = await uploadAPI.uploadImages(selectedFiles, (value) => {
        setUploadProgress(value)
      })
      const imageUrls: string[] = uploadResponse.data?.urls || [uploadResponse.data?.url].filter(Boolean)

      await reportsAPI.create({
        title: title.trim(),
        location: location.trim(),
        description: description.trim(),
        priority,
        image_url: imageUrls[0],
      })

      addToast('Report submitted successfully. Redirecting to your dashboard...', 'success')
      setSuccess(true)
      setReportSubmitted(true)
      setSecondsLeft(3)
    } catch (error: any) {
      console.error('Report submission failed:', error)
      addToast(error?.response?.data?.error || 'Failed to submit report. Please try again.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F9FBFA] flex flex-col items-center justify-center p-4 dark:bg-slate-950">
        <div className="mb-12 flex flex-col items-center group">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-200 mb-4 dark:shadow-none transition-transform group-hover:scale-110">
            <Globe className="text-white w-8 h-8" />
          </div>
          <div className="flex flex-col items-center leading-none">
            <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
              Eco<span className="text-emerald-600">Sync</span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600/60 mt-2">Smart City Hub</span>
          </div>
        </div>

        <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl shadow-emerald-900/5 text-center border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
          <div className="h-24 w-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 dark:bg-emerald-500/10">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Report Submitted!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg leading-relaxed">
            Thank you for helping us keep the community clean. Your report has been sent to our hub for immediate review.
          </p>
          <div className="bg-slate-50 rounded-2xl p-6 mb-10 dark:bg-slate-800/50">
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
              Redirecting to dashboard in <span className="text-emerald-600 font-black text-lg">{secondsLeft}s</span>
            </p>
          </div>
          <Link
            to="/citizen"
            className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <span>Back to home now</span>
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9FBFA] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <CitizenNavbar />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 text-center sm:text-left">
          <Link to="/citizen" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-emerald-600 transition-colors mb-6 group">
            <X size={14} className="group-hover:rotate-90 transition-transform" /> 
            <span>Cancel report</span>
          </Link>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Report an <span className="text-emerald-600">Issue</span>
          </h1>
          <p className="text-slate-500 mt-4 text-lg max-w-2xl leading-relaxed">
            Help us keep our community clean. Provide precise details about the waste site to help our collection teams respond faster.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* SECTION: BASIC INFO */}
          <section className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-slate-200/60 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center dark:bg-emerald-500/10 shrink-0">
                <Info className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Basic Information</h3>
                <p className="text-sm text-slate-500">Essential details about the report</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-black uppercase tracking-widest text-slate-400">
                  Report Title <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="title"
                  placeholder="e.g., Overflowing bin in Central Park"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className={`h-12 rounded-xl border-slate-200 bg-slate-50/50 transition-all dark:border-slate-800 dark:bg-slate-900 ${
                    validationErrors.title ? 'border-rose-500 ring-rose-500/10' : 'focus:border-emerald-500'
                  }`}
                />
                {validationErrors.title && <p className="text-xs font-bold text-rose-500 flex items-center gap-1"><AlertTriangle size={12} /> {validationErrors.title}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="priority" className="text-sm font-black uppercase tracking-widest text-slate-400">
                  Priority Level
                </label>
                <div className="relative">
                  <select
                    id="priority"
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-sm font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:border-slate-800 dark:bg-slate-900"
                  >
                    <option value="low">Low — Routine cleanup</option>
                    <option value="normal">Normal — Standard response</option>
                    <option value="medium">Medium — Urgent</option>
                    <option value="high">High — Immediate attention</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronRight size={16} className="rotate-90" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-black uppercase tracking-widest text-slate-400">
                  Detailed Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="description"
                  placeholder="Describe the condition, size, or any specific instructions..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  className={`flex w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:border-slate-800 dark:bg-slate-900 ${
                    validationErrors.description ? 'border-rose-500 ring-rose-500/10' : ''
                  }`}
                />
                {validationErrors.description && <p className="text-xs font-bold text-rose-500 flex items-center gap-1"><AlertTriangle size={12} /> {validationErrors.description}</p>}
              </div>
            </div>
          </section>

          {/* SECTION: LOCATION */}
          <section className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-slate-200/60 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center dark:bg-blue-500/10 shrink-0">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Location Details</h3>
                <p className="text-sm text-slate-500">Help us find the exact spot</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-black uppercase tracking-widest text-slate-400">
                  Address or Landmark <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="location"
                  placeholder="Enter the nearest address or specific landmark"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className={`h-12 rounded-xl border-slate-200 bg-slate-50/50 transition-all dark:border-slate-800 dark:bg-slate-900 ${
                    validationErrors.location ? 'border-rose-500 ring-rose-500/10' : 'focus:border-emerald-500'
                  }`}
                />
                {validationErrors.location && <p className="text-xs font-bold text-rose-500 flex items-center gap-1"><AlertTriangle size={12} /> {validationErrors.location}</p>}
              </div>
            </div>
          </section>

          {/* SECTION: PHOTOS */}
          <section className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-slate-200/60 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center dark:bg-orange-500/10 shrink-0">
                <Camera className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Evidence Photos</h3>
                <p className="text-sm text-slate-500">Visual proof helps our teams prepare</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {previews.map((src, i) => (                                
                  <div key={src} className="relative aspect-square rounded-2xl overflow-hidden group border border-slate-100 dark:border-slate-800">
                    <img src={src} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 text-rose-600 flex items-center justify-center shadow-lg hover:bg-rose-600 hover:text-white transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                
                {previews.length < 3 && (
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 transition-all dark:border-slate-800 dark:hover:border-emerald-500 dark:hover:bg-emerald-500/5 group">
                    <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                      <ImagePlus className="h-5 w-5 text-slate-400 group-hover:text-emerald-600" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-600">Add Photo</span>
                    <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} />
                  </label>
                )}
              </div>
              
              <div className="flex items-start gap-3 text-xs font-medium text-slate-500 bg-slate-50/80 p-4 rounded-2xl dark:bg-slate-800/50">
                <Info size={16} className="shrink-0 text-emerald-600" />
                <p className="leading-relaxed">Upload up to 3 clear photos. Max 10MB each. Supported formats: JPG, PNG, WebP.</p>
              </div>
              {errors.images && <p className="text-xs font-bold text-rose-500 flex items-center gap-1"><AlertTriangle size={12} /> {errors.images}</p>}
            </div>
          </section>

          {/* SECTION: TERMS & SUBMIT */}
          <div className="space-y-8 pt-4">
            <div className="flex items-start gap-4 p-6 rounded-[2rem] bg-emerald-50/30 border border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/10">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                className="mt-1 h-5 w-5 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer"
              />
              <label htmlFor="terms" className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed cursor-pointer select-none">
                I confirm that the information provided is accurate and the report is submitted in good faith to help improve municipal waste collection.
              </label>
            </div>
            {errors.terms && <p className="text-xs font-bold text-rose-500 text-center">{errors.terms}</p>}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-lg shadow-xl shadow-emerald-200/50 dark:shadow-none transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Submitting... {uploadProgress}%</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Submit Report</span>
                  <ChevronRight size={20} />
                </div>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
