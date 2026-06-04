import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { User } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

export function CitizenNavbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) return null

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 dark:bg-slate-950 dark:border-slate-700">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm">
            ♻
          </span>
          <div>
            <Link to="/citizen" className="text-xl font-semibold text-slate-900 hover:text-emerald-600 dark:text-slate-100">
              EcoOps Citizen Hub
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400">Your community waste report portal</p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-3">
          <Link
            to="/citizen"
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Home
          </Link>
          <Link
            to="/citizen/reports"
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            All reports
          </Link>
          <Link
            to="/citizen/report"
            className="rounded-full border border-emerald-500 bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
          >
            New report
          </Link>
          <Link
            to="/citizen/profile"
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Open profile"
          >
            <User size={18} />
          </Link>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  )
}
