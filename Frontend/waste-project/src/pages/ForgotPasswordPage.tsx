import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authAPI } from '@/lib/api'
import { Globe, Mail, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authAPI.forgotPassword(email)
      setSubmitted(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FBFA] p-4 dark:bg-slate-950">
      <div className="mb-12 flex flex-col items-center group">
        <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-200 mb-4 dark:shadow-none transition-transform group-hover:scale-110">
          <Globe className="text-white w-8 h-8" />
        </div>
        <div className="flex flex-col items-center leading-none">
          <span className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
            Eco<span className="text-emerald-600">Sync</span>
          </span>
          <span className="text-xs font-black uppercase tracking-[0.3em] text-emerald-600/60 mt-2">Smart City Hub</span>
        </div>
      </div>

      <div className="max-w-md w-full bg-white rounded-[3rem] p-10 sm:p-12 shadow-2xl shadow-emerald-900/5 border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
        {submitted ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h2 className="mt-6 text-2xl font-black tracking-tight text-slate-900 dark:text-white">Check your inbox</h2>
            <p className="mt-3 text-slate-500 font-medium">
              If an account exists for <span className="font-bold text-slate-700 dark:text-slate-300">{email}</span>, a
              password reset link has been sent. The link expires in 1 hour.
            </p>
            <Link to="/login">
              <Button className="mt-8 w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-sm">
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Forgot password?</h2>
              <p className="mt-3 text-slate-500 font-medium">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 dark:bg-rose-500/10 dark:border-rose-500/20">
                  <span className="h-2 w-2 rounded-full bg-rose-600" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                    <Mail size={18} />
                  </div>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50/50 transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-900"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-base shadow-xl shadow-emerald-200/50 dark:shadow-none transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Send Reset Link</span>
                    <ArrowRight size={18} />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-sm font-medium text-slate-500">
                Remembered your password?{' '}
                <Link to="/login" className="text-emerald-600 font-black uppercase tracking-widest hover:text-emerald-700 transition-colors ml-1">
                  Sign In
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
