import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { userAPI } from '@/lib/api'
import { useToastStore } from '@/stores/toastStore'
import { CitizenNavbar } from '@/components/CitizenNavbar'
import { formatDate } from '@/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft, User as UserIcon, Mail, MapPin, Phone, ShieldCheck,
  Pencil, X, Check, Loader2
} from 'lucide-react'

interface ProfileData {
  id: string
  name: string
  email: string
  role: string
  is_verified?: boolean
  phone?: string
  address?: string
  created_at: string
}

export function CitizenProfile() {
  const authUser = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const addToast = useToastStore((state) => state.addToast)

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userAPI.getProfile()
        const data: ProfileData = response.data
        setProfile(data)
        setForm({ name: data.name ?? '', phone: data.phone ?? '', address: data.address ?? '' })
      } catch (error: any) {
        addToast(error?.response?.data?.message || 'Unable to load your profile.', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [addToast])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters.'
    if (form.phone && !/^\+?[0-9\s\-()+]+$/.test(form.phone)) e.phone = 'Enter a valid phone number.'
    if (form.address && form.address.length > 255) e.address = 'Address must not exceed 255 characters.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const response = await userAPI.updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
      })
      const updated: ProfileData = response.data.user
      setProfile(updated)
      if (authUser) setUser({ ...authUser, name: updated.name })
      setEditing(false)
      addToast('Profile updated successfully.', 'success')
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Failed to update profile.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) setForm({ name: profile.name ?? '', phone: profile.phone ?? '', address: profile.address ?? '' })
    setErrors({})
    setEditing(false)
  }

  const initials = (authUser?.name ?? profile?.name ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <CitizenNavbar />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Your profile</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">My account</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Manage your personal information and account details.
            </p>
          </div>
          <Link
            to="/citizen"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
        </div>

        {loading ? (
          <div className="rounded-[2rem] bg-white p-12 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 space-y-8">

            {/* Avatar + role row */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-600 text-2xl font-bold text-white">
                  {initials}
                </div>
                <div>
                  <p className="text-xl font-semibold">{profile?.name ?? authUser?.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{profile?.email ?? authUser?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                  {profile?.role ?? authUser?.role}
                </span>
                {profile?.is_verified !== undefined && (
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                    profile.is_verified
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                  }`}>
                    {profile.is_verified ? 'Verified' : 'Unverified'}
                  </span>
                )}
              </div>
            </div>

            {/* Editable fields */}
            {editing ? (
              <div className="space-y-5">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Edit information</h2>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="pl-10 h-12 rounded-xl"
                      placeholder="Your full name"
                    />
                  </div>
                  {errors.name && <p className="text-xs text-rose-500 font-semibold px-1">{errors.name}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="pl-10 h-12 rounded-xl"
                      placeholder="+237 6xx xxx xxx"
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-rose-500 font-semibold px-1">{errors.phone}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="pl-10 h-12 rounded-xl"
                      placeholder="Street, Neighbourhood, Buea"
                    />
                  </div>
                  {errors.address && <p className="text-xs text-rose-500 font-semibold px-1">{errors.address}</p>}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check size={16} />}
                    Save changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={saving}
                    className="h-12 px-6 rounded-xl font-bold gap-2"
                  >
                    <X size={16} />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <ProfileField icon={<UserIcon className="h-5 w-5 text-emerald-600" />} label="Full name" value={profile?.name} />
                  <ProfileField icon={<Mail className="h-5 w-5 text-emerald-600" />} label="Email address" value={profile?.email} />
                  <ProfileField icon={<Phone className="h-5 w-5 text-emerald-600" />} label="Phone" value={profile?.phone} placeholder="Not provided" />
                  <ProfileField icon={<MapPin className="h-5 w-5 text-emerald-600" />} label="Address" value={profile?.address} placeholder="Not provided" />
                </div>
                <ProfileField
                  icon={<ShieldCheck className="h-5 w-5 text-emerald-600" />}
                  label="Account created"
                  value={profile?.created_at ? formatDate(profile.created_at) : undefined}
                />

                <div className="pt-2">
                  <Button
                    onClick={() => setEditing(true)}
                    variant="outline"
                    className="h-12 px-6 rounded-xl font-bold gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
                  >
                    <Pencil size={16} />
                    Edit profile
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function ProfileField({
  icon,
  label,
  value,
  placeholder = 'Not available',
}: {
  icon: React.ReactNode
  label: string
  value?: string | null
  placeholder?: string
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-3">
        {icon}
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</p>
      </div>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{value || placeholder}</p>
    </div>
  )
}
