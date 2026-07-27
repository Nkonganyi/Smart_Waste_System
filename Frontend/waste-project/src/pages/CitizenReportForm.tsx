import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { reportsAPI, uploadAPI } from '@/lib/api'
import { useToastStore } from '@/stores/toastStore'
import { compressImage } from '@/utils'
import { CitizenNavbar } from '@/components/CitizenNavbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertTriangle, CheckCircle2, ImagePlus, MapPin, Globe,
  X, ChevronRight, Camera, Info, Loader2, Locate
} from 'lucide-react'

export function CitizenReportForm() {
  const addToast = useToastStore((state) => state.addToast)
  const navigate = useNavigate()

  const [location, setLocation] = useState('')
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<'low' | 'normal' | 'medium' | 'high'>('normal')
  const [description, setDescription] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [success, setSuccess] = useState(false)
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([])
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(3)
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationValid, setLocationValid] = useState<boolean | null>(null)
  const suggestionTimer = useRef<number | null>(null)
  const locationRef = useRef<HTMLDivElement>(null)

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url))
      if (suggestionTimer.current) window.clearTimeout(suggestionTimer.current)
    }
  }, [previews])

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Get GPS location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      addToast('Geolocation is not supported by your browser', 'warning')
      return
    }
    setIsGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setGpsCoords({ lat: latitude, lng: longitude })
        // Set location to coordinates string as fallback
        const coordsString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        setLocation(coordsString)
        // Clear location errors since we filled it
        setFieldErrors((prev) => ({ ...prev, location: '' }))
        
        try {
          // First validate coordinates
          const validationRes = await reportsAPI.validateCoords(latitude, longitude)
          if (validationRes.data.valid) {
            setLocationValid(true)
          }
          // Now try reverse geocoding to get a human-readable address
          try {
            const reverseRes = await reportsAPI.reverseGeocode(latitude, longitude)
            if (reverseRes.data.success && reverseRes.data.address) {
              setLocation(reverseRes.data.address)
              addToast('GPS location acquired successfully!', 'success')
            } else {
              addToast('GPS location acquired successfully! (Using coordinates)', 'success')
            }
          } catch (reverseErr) {
            console.error('Reverse geocoding failed:', reverseErr)
            addToast('GPS location acquired successfully! (Using coordinates)', 'success')
          }
        } catch (err) {
          console.error(err)
          addToast('GPS location acquired successfully! (Using coordinates)', 'success')
        } finally {
          setIsGettingLocation(false)
        }
      },
      (error) => {
        setIsGettingLocation(false)
        let errMsg = 'Failed to get location'
        if (error.code === error.PERMISSION_DENIED) {
          errMsg = 'Location permission denied. Please allow it in your browser settings.'
        }
        addToast(errMsg, 'error')
      }
    )
  }

  // Debounced location suggestions
  useEffect(() => {
    if (!location || location.length < 3) {
      setLocationSuggestions([])
      setShowSuggestions(false)
      return
    }
    setSuggestionLoading(true)
    if (suggestionTimer.current) window.clearTimeout(suggestionTimer.current)
    suggestionTimer.current = window.setTimeout(async () => {
      try {
        const response = await reportsAPI.getLocationSuggestions(location)
        const suggestions = response.data || []
        setLocationSuggestions(suggestions)
        setShowSuggestions(suggestions.length > 0)
        // Validate location when user stops typing
        const validationRes = await reportsAPI.validateLocation(location)
        setLocationValid(validationRes.data.valid)
      } catch {
        // Suggestions are non-critical; silently ignore
      } finally {
        setSuggestionLoading(false)
      }
    }, 500)
  }, [location])

  // Countdown redirect after successful submission
  useEffect(() => {
    if (!success) return
    if (secondsLeft <= 0) { navigate('/citizen'); return }
    const timer = window.setTimeout(() => setSecondsLeft((n) => n - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [secondsLeft, success, navigate])

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    const acceptedFiles: File[] = []
    const nextPreviews: string[] = []
    const errors: string[] = []
    const remaining = 3 - selectedFiles.length

    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i]
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
        errors.push(`${file.name}: unsupported type (JPEG, PNG, WebP only).`)
        continue
      }
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: must be under 10 MB.`)
        continue
      }
      try {
        const compressed = await compressImage(file, 10)
        acceptedFiles.push(compressed)
        nextPreviews.push(URL.createObjectURL(compressed))
      } catch {
        errors.push(`${file.name}: could not process file.`)
      }
    }

    if (errors.length > 0) addToast(errors.join(' '), 'warning')
    setSelectedFiles((prev) => [...prev, ...acceptedFiles].slice(0, 3))
    setPreviews((prev) => [...prev, ...nextPreviews].slice(0, 3))
    event.target.value = ''
  }

  const handleRemoveImage = (index: number) => {
    setSelectedFiles((files) => files.filter((_, i) => i !== index))
    setPreviews((urls) => {
      URL.revokeObjectURL(urls[index])
      return urls.filter((_, i) => i !== index)
    })
  }

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Report title is required.'
    if (!location.trim() || location.trim().length < 5) e.location = 'Please enter a full address or landmark (at least 5 characters).'
    if (!description.trim()) e.description = 'Please describe the waste issue.'
    if (!termsAccepted) e.terms = 'You must confirm the report accuracy before submitting.'
    return e
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      addToast('Please fix the highlighted fields before submitting.', 'error')
      return
    }
    setFieldErrors({})
    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      let imageUrl: string | undefined
      let imageUrls: string[] | undefined

      // Image upload is optional — only upload if files were selected
      if (selectedFiles.length > 0) {
        const uploadResponse = await uploadAPI.uploadImages(selectedFiles, (progress) => {
          setUploadProgress(progress)
        })
        const urls: string[] = uploadResponse.data?.urls || (uploadResponse.data?.url ? [uploadResponse.data.url] : [])
        imageUrl = urls[0]
        imageUrls = urls.length > 1 ? urls : undefined
      }

      const response = await reportsAPI.create({
        title: title.trim(),
        location: location.trim(),
        description: description.trim(),
        priority,
        ...(imageUrl ? { image_url: imageUrl } : {}),
        ...(imageUrls ? { image_urls: imageUrls } : {}),
      })

      const isDup = response.data?.report?.is_duplicate === true
      setIsDuplicate(isDup)
      setSuccess(true)
      setSecondsLeft(3)
      addToast(
        isDup
          ? 'Report submitted. A similar nearby report already exists — yours has been linked to it.'
          : 'Report submitted successfully!',
        'success'
      )
    } catch (error: any) {
      addToast(error?.response?.data?.error || error?.response?.data?.message || 'Failed to submit report. Please try again.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#F9FBFA] flex flex-col items-center justify-center p-4 dark:bg-slate-950">
        <div className="mb-12 flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-200 mb-4 dark:shadow-none">
            <Globe className="text-white w-8 h-8" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
            Eco<span className="text-emerald-600">Sync</span>
          </span>
        </div>
        <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl shadow-emerald-900/5 text-center border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
          <div className="h-24 w-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 dark:bg-emerald-500/10">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Report Submitted!</h2>
          {isDuplicate && (
            <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300 px-5 py-4 text-sm font-semibold">
              A similar report already exists nearby. Your report has been linked to it and will be handled together.
            </div>
          )}
          <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg leading-relaxed">
            Thank you for helping keep the community clean. Our team will review your report shortly.
          </p>
          <div className="bg-slate-50 rounded-2xl p-6 mb-10 dark:bg-slate-800/50">
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
              Redirecting in <span className="text-emerald-600 font-black text-lg">{secondsLeft}s</span>
            </p>
          </div>
          <Link to="/citizen" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors">
            <span>Back to home now</span>
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    )
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F9FBFA] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <CitizenNavbar />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 text-center sm:text-left">
          <Link to="/citizen" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-emerald-600 transition-colors mb-6 group">
            <X size={14} className="group-hover:rotate-90 transition-transform" />
            <span>Cancel</span>
          </Link>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Report an <span className="text-emerald-600">Issue</span>
          </h1>
          <p className="text-slate-500 mt-4 text-lg max-w-2xl leading-relaxed">
            Provide details about the waste site to help our collection teams respond faster.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-10">
          {/* ── Basic Info ── */}
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
              {/* Title */}
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-black uppercase tracking-widest text-slate-400">
                  Report Title <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="title"
                  placeholder="e.g., Overflowing bin at Town Hall junction"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setFieldErrors((p) => ({ ...p, title: '' })) }}
                  className={`h-12 rounded-xl transition-all ${fieldErrors.title ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-slate-200 bg-slate-50/50 focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900'}`}
                />
                {fieldErrors.title && <FieldError msg={fieldErrors.title} />}
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label htmlFor="priority" className="text-sm font-black uppercase tracking-widest text-slate-400">Priority Level</label>
                <div className="relative">
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as typeof priority)}
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

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-black uppercase tracking-widest text-slate-400">
                  Detailed Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="description"
                  placeholder="Describe the condition, size, or any specific instructions for collectors..."
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setFieldErrors((p) => ({ ...p, description: '' })) }}
                  rows={4}
                  className={`flex w-full rounded-2xl border px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:bg-slate-900 ${fieldErrors.description ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-slate-200 bg-slate-50/50 dark:border-slate-800'}`}
                />
                {fieldErrors.description && <FieldError msg={fieldErrors.description} />}
              </div>
            </div>
          </section>

          {/* ── Location ── */}
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

            <div className="space-y-2" ref={locationRef}>
              <label htmlFor="location" className="text-sm font-black uppercase tracking-widest text-slate-400">
                Address or Landmark <span className="text-rose-500">*</span>
              </label>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="location"
                        placeholder="e.g., Molyko Junction, behind Soppo market or 4.155, 9.231"
                        value={location}
                        onFocus={() => locationSuggestions.length > 0 && setShowSuggestions(true)}
                        onChange={(e) => {
                          setLocation(e.target.value)
                          setFieldErrors((p) => ({ ...p, location: '' }))
                        }}
                        className={`pl-10 h-12 rounded-xl transition-all ${fieldErrors.location ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-slate-200 bg-slate-50/50 focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900'}`}
                      />
                      {suggestionLoading && (
                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                      )}
                    </div>

                    {/* Suggestions dropdown */}
                    {showSuggestions && locationSuggestions.length > 0 && (
                      <ul className="absolute top-full left-0 right-0 z-50 mt-1 max-h-52 overflow-auto rounded-2xl border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                        {locationSuggestions.map((s, i) => (
                          <li key={i}>
                            <button
                              type="button"
                              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                              onClick={() => { setLocation(s); setShowSuggestions(false) }}
                            >
                              <MapPin size={14} className="shrink-0 text-slate-400" />
                              {s}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    variant="secondary"
                    className="h-12 px-4 flex items-center gap-2"
                  >
                    {isGettingLocation ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Locate className="h-4 w-4" />
                    )}
                    Use My Location
                  </Button>
                </div>

                {/* Location validation indicator */}
                {locationValid !== null && (
                  <div className={`flex items-center gap-2 text-sm font-medium ${locationValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {locationValid ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <AlertTriangle size={16} />
                    )}
                    {locationValid
                      ? 'Location looks valid!'
                      : 'We couldn\'t verify this location — please double-check your address'}
                  </div>
                )}
              </div>
              {fieldErrors.location && <FieldError msg={fieldErrors.location} />}
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                <Info size={11} /> Be as specific as possible — include a street name, quarter, or landmark.
              </p>
            </div>
          </section>

          {/* ── Photos (optional) ── */}
          <section className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-slate-200/60 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center dark:bg-orange-500/10 shrink-0">
                <Camera className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Evidence Photos <span className="text-sm font-medium text-slate-400 normal-case">(optional)</span></h3>
                <p className="text-sm text-slate-500">Visual proof helps our teams prepare</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {previews.map((src, i) => (
                  <div key={src} className="relative aspect-square rounded-2xl overflow-hidden group border border-slate-100 dark:border-slate-800">
                    <img src={src} alt={`Preview ${i + 1}`} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 text-rose-600 flex items-center justify-center shadow-lg hover:bg-rose-600 hover:text-white transition-all"
                      aria-label="Remove photo"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {previews.length < 3 && (
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 transition-all dark:border-slate-800 dark:hover:border-emerald-500 group">
                    <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors dark:bg-slate-800">
                      <ImagePlus className="h-5 w-5 text-slate-400 group-hover:text-emerald-600" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-600">Add Photo</span>
                    <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFileChange} />
                  </label>
                )}
              </div>
              <div className="flex items-start gap-3 text-xs font-medium text-slate-500 bg-slate-50/80 p-4 rounded-2xl dark:bg-slate-800/50">
                <Info size={16} className="shrink-0 text-emerald-600 mt-0.5" />
                <p className="leading-relaxed">Up to 3 photos, max 10 MB each. Formats: JPG, PNG, WebP.</p>
              </div>
            </div>
          </section>

          {/* ── Terms & Submit ── */}
          <div className="space-y-6 pt-2">
            <div className={`flex items-start gap-4 p-6 rounded-[2rem] border transition-all ${fieldErrors.terms ? 'bg-rose-50 border-rose-200 dark:bg-rose-500/5 dark:border-rose-500/20' : 'bg-emerald-50/30 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/10'}`}>
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => { setTermsAccepted(e.target.checked); setFieldErrors((p) => ({ ...p, terms: '' })) }}
                className="mt-1 h-5 w-5 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="terms" className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed cursor-pointer select-none">
                I confirm that the information provided is accurate and this report is submitted in good faith to help improve municipal waste collection in Buea.
              </label>
            </div>
            {fieldErrors.terms && <FieldError msg={fieldErrors.terms} />}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-lg shadow-xl shadow-emerald-200/50 dark:shadow-none transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>{selectedFiles.length > 0 ? `Uploading... ${uploadProgress}%` : 'Submitting...'}</span>
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

function FieldError({ msg }: { msg: string }) {
  return (
    <p className="text-xs font-bold text-rose-500 flex items-center gap-1 mt-1">
      <AlertTriangle size={12} /> {msg}
    </p>
  )
}
