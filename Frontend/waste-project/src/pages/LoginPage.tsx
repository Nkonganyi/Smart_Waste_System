import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { Globe, Mail, Lock, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authAPI.login(formData)
      const { user, token } = response.data
      login(user, token)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FBFA] p-4 dark:bg-slate-950">
      {/* Branding Header */}
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
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Welcome Back</h2>
          <p className="mt-3 text-slate-500 font-medium">Please sign in to your dashboard</p>
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
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50/50 transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-900"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</label>
              <Link to="/forgot-password" className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700">
                Forgot?
              </Link>
            </div>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                <Lock size={18} />
              </div>
              <Input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50/50 transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-900"
                placeholder="••••••••"
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
                <span>Authenticating...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>Sign In</span>
                <ArrowRight size={18} />
              </div>
            )}
          </Button>
        </form>

        <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-sm font-medium text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-600 font-black uppercase tracking-widest hover:text-emerald-700 transition-colors ml-1">
              Create One
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
