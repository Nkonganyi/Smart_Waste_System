import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '@/lib/api'
import { Globe, User, Mail, Lock, Loader2, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'citizen',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      })
      navigate('/login', { state: { message: 'Registration successful. Please log in.' } })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FBFA] p-4 py-12 dark:bg-slate-950">
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

      <div className="max-w-xl w-full bg-white rounded-[3rem] p-10 sm:p-12 shadow-2xl shadow-emerald-900/5 border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Create Account</h2>
          <p className="mt-3 text-slate-500 font-medium">Join our mission for a cleaner city</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 dark:bg-rose-500/10 dark:border-rose-500/20">
              <span className="h-2 w-2 rounded-full bg-rose-600" />
              {error}
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <User size={18} />
                </div>
                <Input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50/50 transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-900"
                  placeholder="John Doe"
                />
              </div>
            </div>

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
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Account Role</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors z-10">
                <ShieldCheck size={18} />
              </div>
              <select
                title="Role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="flex h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-12 pr-4 py-2 text-sm font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-900"
              >
                <option value="citizen">Citizen — Community Member</option>
                <option value="collector">Collector — Service Provider</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ArrowRight size={16} className="rotate-90" />
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
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

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <CheckCircle2 size={18} />
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
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-base shadow-xl shadow-emerald-200/50 dark:shadow-none transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Creating Account...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>Sign Up Now</span>
                <ArrowRight size={18} />
              </div>
            )}
          </Button>
        </form>

        <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-sm font-medium text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 font-black uppercase tracking-widest hover:text-emerald-700 transition-colors ml-1">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
