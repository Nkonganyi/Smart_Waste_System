import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { reportsAPI, uploadAPI } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { compressImage } from '@/utils'
import { CitizenNavbar } from '@/components/CitizenNavbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle, CheckCircle2, ImagePlus, MapPin, Sparkles } from 'lucide-react'

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
        image_urls: imageUrls,
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <CitizenNavbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[.24em] text-emerald-600">Citizen report</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
                Submit a new waste report
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base">
                Help your neighborhood stay clean. Capture the title, location, and images so collection teams can respond quickly.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/citizen"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6 rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Report details</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Complete all required fields below to submit your case.</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                <Sparkles className="h-4 w-4" /> Fast review
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium text-slate-700">
                    Report title
                  </label>
                  <Input
                    id="title"
                    name="title"
                    autoComplete="off"
                    placeholder="Enter a short report title"
                    value={title}
                    onChange={(event) => {
                      setTitle(event.target.value)
                      setValidationErrors((prev) => ({ ...prev, title: '' }))
                    }}
                    className={errors.title ? 'border-destructive' : ''}
                    aria-invalid={Boolean(errors.title)}
                    aria-describedby={errors.title ? 'title-error' : undefined}
                  />
                  {errors.title ? (
                    <p id="title-error" className="text-sm text-destructive">{errors.title}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium text-slate-700">
                    Location
                  </label>
                  <Input
                    id="location"
                    name="location"
                    autoComplete="off"
                    placeholder="Enter address or landmark"
                    value={location}
                    onChange={(event) => {
                      setLocation(event.target.value)
                      setValidationErrors((prev) => ({ ...prev, location: '' }))
                    }}
                    className={errors.location ? 'border-destructive' : ''}
                    aria-invalid={Boolean(errors.location)}
                    aria-describedby={errors.location ? 'location-error' : undefined}
                  />
                  {errors.location ? (
                    <p id="location-error" className="text-sm text-destructive">{errors.location}</p>
                  ) : null}
                  {locationSuggestions.length > 0 && (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 shadow-sm">
                      <p className="mb-2 text-xs uppercase tracking-[.2em] text-slate-500">Suggestions</p>
                      <div className="grid gap-2">
                        {locationSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            className="w-full rounded-3xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                            onClick={() => {
                              setLocation(suggestion)
                              setLocationSuggestions([])
                            }}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="priority" className="text-sm font-medium text-slate-700">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(event) => setPriority(event.target.value as 'low' | 'normal' | 'medium' | 'high')}
                    className="h-11 w-full rounded-3xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none ring-1 ring-transparent transition focus:border-emerald-400 focus:ring-emerald-200"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  placeholder="Describe the waste site condition in detail"
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value)
                    setValidationErrors((prev) => ({ ...prev, description: '' }))
                  }}
                  className={`w-full rounded-3xl border px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 ${errors.description ? 'border-destructive' : 'border-slate-300'}`}
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby={errors.description ? 'description-error' : undefined}
                />
                {errors.description ? (
                  <p id="description-error" className="text-sm text-destructive">{errors.description}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="images" className="text-sm font-medium text-slate-700">
                    Photos (up to 3)
                  </label>
                  <span className="text-sm text-slate-500">JPG, PNG, WebP — max 10MB each</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <label className="group relative flex cursor-pointer items-center justify-center rounded-3xl border border-slate-300 bg-slate-50 px-4 py-5 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50">
                    <input
                      id="images"
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                    <span className="flex flex-col items-center gap-2 text-slate-700">
                      <ImagePlus className="h-6 w-6" />
                      Add images
                    </span>
                  </label>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    {selectedCount > 0 ? (
                      <p>{selectedCount} image{selectedCount > 1 ? 's' : ''} selected</p>
                    ) : (
                      <p>No images selected yet</p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">Preview your selected photos before sending.</p>
                  </div>
                </div>
                {errors.images ? (
                  <p className="text-sm text-destructive">{errors.images}</p>
                ) : null}

                {previews.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {previews.map((url, index) => (
                      <div key={url} className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                        <img src={url} alt={`Selected preview ${index + 1}`} className="h-32 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-900 shadow-md transition hover:bg-slate-200"
                          aria-label={`Remove image ${index + 1}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <input
                  id="terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(event) => {
                    setTermsAccepted(event.target.checked)
                    setValidationErrors((prev) => ({ ...prev, terms: '' }))
                  }}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="terms" className="text-sm leading-6 text-slate-700">
                  I confirm this report is accurate and reflects the current waste site condition.
                </label>
              </div>
              {errors.terms ? (
                <p className="text-sm text-destructive">{errors.terms}</p>
              ) : null}

              <div className="space-y-3">
                <Button type="submit" disabled={isSubmitting} className="w-full rounded-3xl px-6 py-3 text-base font-semibold">
                  {isSubmitting ? 'Submitting report…' : 'Submit report'}
                </Button>

                {isSubmitting && (
                  <div className="rounded-3xl bg-slate-100 p-3">
                    <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                      <span>Upload progress</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </form>
          </section>

          <aside className="space-y-6 rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="rounded-[1.75rem] border border-emerald-100 bg-emerald-50 p-6">
              <div className="flex items-center gap-3 text-emerald-700">
                <MapPin className="h-5 w-5" />
                <p className="text-sm font-semibold">Location support</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Enter the exact address or choose a suggestion from search. If the system can geocode your location automatically, we will attach coordinates to your report.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold text-slate-900">What to include</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li className="flex gap-2"><span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-600">✓</span> Accurate location or landmark</li>
                <li className="flex gap-2"><span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-600">✓</span> Clear, concise report title</li>
                <li className="flex gap-2"><span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-600">✓</span> Photos showing the issue</li>
              </ul>
            </div>
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <p className="font-semibold text-slate-900">Secure & verified</p>
              </div>
              <p className="mt-3 leading-6">
                All citizen reports are protected and shared only with authorized collection staff. You will be redirected back when your report is accepted.
              </p>
            </div>
          </aside>
        </div>

        {success && (
          <div className="mt-8 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-900 shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold">You're all set!</h2>
            <p className="mt-2 text-sm leading-6 text-slate-800">Your report has been submitted successfully.</p>
            <p className="mt-3 text-sm text-slate-700">Redirecting to your dashboard in {secondsLeft} second{secondsLeft === 1 ? '' : 's'}.</p>
          </div>
        )}
      </main>
    </div>
  )
}
