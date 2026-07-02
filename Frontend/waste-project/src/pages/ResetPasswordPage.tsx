import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authAPI } from '@/lib/api'
import { Globe, Lock, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function getStrength(password: string) {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++
  return score
}

const STRENGTH_LABELS = ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong']
const STRENGTH_COLORS = ['', 'bg-rose-500', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-500', 'bg-emerald-600']

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const strength = getStrength(formData.password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('No reset token found. Please request a new password reset link.')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (strength < 4) {
      setError('Please choose a stronger password (uppercase, lowercase, number, and special character).')
      return
    }

    setLoading(true)
    try {
      await authAPI.resetPassword(token, formData.password)
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.')
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
        {done ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h2 className="mt-6 text-2xl font-black tracking-tight text-slate-900 dark:text-white">Password reset!</h2>
            <p className="mt-3 text-slate-500 font-medium">
              Your password has been updated. Redirecting you to sign in…
            </p>
            <Link to="/login">
              <Button className="mt-8 w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-sm">
                Go to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Set new password</h2>
              <p className="mt-3 text-slate-500 font-medium">
                Choose a strong password for your account.
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
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Password</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                    <Lock size={18} />
                  </div>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-12 pr-12 h-14 rounded-2xl border-slate-200 bg-slate-50/50 transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-900"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {formData.password && (
                  <div className="space-y-1 px-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div
                          key={n}
                          className={`h-1 flex-1 rounded-full transition-all ${n <= strength ? STRENGTH_COLORS[strength] : 'bg-slate-200 dark:bg-slate-700'}`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-bold ${strength >= 4 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {STRENGTH_LABELS[strength]}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm Password</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                    <Lock size={18} />
                  </div>
                  <Input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50/50 transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-900"
                    placeholder="••••••••"
                  />
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs font-bold text-rose-500 px-1">Passwords do not match</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-base shadow-xl shadow-emerald-200/50 dark:shadow-none transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Resetting...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Reset Password</span>
                    <ArrowRight size={18} />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800 text-center">
              <Link to="/login" className="text-sm font-bold text-emerald-600 hover:text-emerald-700">
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
