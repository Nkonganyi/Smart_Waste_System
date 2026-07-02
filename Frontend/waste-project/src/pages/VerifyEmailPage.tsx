import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authAPI } from '@/lib/api'
import { Globe, CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Status = 'verifying' | 'success' | 'error'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<Status>('verifying')
  const [message, setMessage] = useState('')
  const [resendEmail, setResendEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('This verification link is missing a token.')
      return
    }

    authAPI
      .verifyEmail(token)
      .then((res) => {
        setStatus('success')
        setMessage(res.data?.message || 'Email verified successfully! You can now log in.')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.response?.data?.message || 'This verification link is invalid or has expired.')
      })
  }, [token])

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    setResendLoading(true)
    setResendMessage('')
    try {
      const res = await authAPI.resendVerification(resendEmail)
      setResendMessage(res.data?.message || 'If an account exists, a verification link has been sent.')
    } catch (err: any) {
      setResendMessage(err.response?.data?.message || 'Failed to resend verification email.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FBFA] p-4 dark:bg-slate-950">
      <div className="mb-12 flex flex-col items-center group">
        <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-200 mb-4 dark:shadow-none">
          <Globe className="text-white w-8 h-8" />
        </div>
        <div className="flex flex-col items-center leading-none">
          <span className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
            Eco<span className="text-emerald-600">Sync</span>
          </span>
          <span className="text-xs font-black uppercase tracking-[0.3em] text-emerald-600/60 mt-2">Smart City Hub</span>
        </div>
      </div>

      <div className="max-w-md w-full bg-white rounded-[3rem] p-10 sm:p-12 shadow-2xl shadow-emerald-900/5 border border-slate-100 dark:bg-slate-900 dark:border-slate-800 text-center">
        {status === 'verifying' && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-emerald-600" />
            <h2 className="mt-6 text-2xl font-black tracking-tight text-slate-900 dark:text-white">Verifying your email...</h2>
            <p className="mt-2 text-slate-500 font-medium">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h2 className="mt-6 text-2xl font-black tracking-tight text-slate-900 dark:text-white">Email verified!</h2>
            <p className="mt-2 text-slate-500 font-medium">{message}</p>
            <Link to="/login">
              <Button className="mt-8 w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-sm">
                Go to Sign In
              </Button>
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-rose-600" />
            <h2 className="mt-6 text-2xl font-black tracking-tight text-slate-900 dark:text-white">Verification failed</h2>
            <p className="mt-2 text-slate-500 font-medium">{message}</p>

            <form onSubmit={handleResend} className="mt-8 space-y-4 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Resend verification link
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={18} />
                </div>
                <Input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950"
                />
              </div>
              <Button
                type="submit"
                disabled={resendLoading}
                className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-sm disabled:opacity-70"
              >
                {resendLoading ? 'Sending...' : 'Resend verification email'}
              </Button>
              {resendMessage && (
                <p className="text-center text-sm font-semibold text-slate-600 dark:text-slate-300">{resendMessage}</p>
              )}
            </form>
          </>
        )}

        <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800 text-center">
          <Link to="/login" className="text-sm font-bold text-emerald-600 hover:text-emerald-700">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
