import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { userAPI } from '@/lib/api'
import { useToastStore } from '@/stores/toastStore'
import { CitizenNavbar } from '@/components/CitizenNavbar'
import { formatDate } from '@/utils'
import type { User } from '@/stores/authStore'
import { ArrowLeft, User as UserIcon, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react'

export function CitizenProfile() {
  const authUser = useAuthStore((state) => state.user)
  const addToast = useToastStore((state) => state.addToast)
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userAPI.getProfile()
        setProfile(response.data)
      } catch (error: any) {
        console.error('Failed to load profile:', error)
        addToast(error?.response?.data?.message || 'Unable to load your profile.', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [addToast])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <CitizenNavbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Your profile</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">My account</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Review your personal information and account details.
            </p>
          </div>
          <Link
            to="/citizen"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
        </div>

        <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-600 text-2xl font-semibold text-white">
                {authUser?.name?.split(' ').map((part) => part[0]).join('') ?? 'U'}
              </div>
              <div>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{authUser?.name ?? 'Citizen User'}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{authUser?.email}</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
              {authUser?.role ?? 'citizen'}
            </span>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
                <UserIcon className="h-5 w-5 text-emerald-600" />
                <p className="font-semibold">Full name</p>
              </div>
              <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">{profile?.name || authUser?.name || 'Not available'}</p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
                <Mail className="h-5 w-5 text-emerald-600" />
                <p className="font-semibold">Email address</p>
              </div>
              <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">{profile?.email || authUser?.email || 'Not available'}</p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
                <Phone className="h-5 w-5 text-emerald-600" />
                <p className="font-semibold">Phone</p>
              </div>
              <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">{profile?.phone || 'Not provided'}</p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
                <MapPin className="h-5 w-5 text-emerald-600" />
                <p className="font-semibold">Address</p>
              </div>
              <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">{profile?.address || 'Not provided'}</p>
            </div>
          </div>

          <div className="mt-10 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <p className="font-semibold">Account created</p>
            </div>
            <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">
              {profile?.created_at ? formatDate(profile.created_at) : 'Unknown'}
            </p>
          </div>

          {loading && (
            <div className="mt-8 rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              Loading profile information...
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
