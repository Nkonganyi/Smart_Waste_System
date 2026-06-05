import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { User, Globe, LogOut, FileText, PlusCircle, LayoutDashboard } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

export function CitizenNavbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) return null

  const navLinks = [
    { name: 'Dashboard', path: '/citizen', icon: LayoutDashboard },
    { name: 'Reports', path: '/citizen/reports', icon: FileText },
    { name: 'New Report', path: '/citizen/report', icon: PlusCircle },
  ]

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 dark:bg-slate-950/80 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 h-20 flex items-center justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/citizen" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-105 transition-all dark:shadow-none">
              <Globe className="text-white w-5 h-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">
                Eco<span className="text-emerald-600">Sync</span>
              </span>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-600/60 mt-1">Smart City Hub</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path
              const Icon = link.icon
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-full transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-slate-900'
                  }`}
                >
                  <Icon size={16} />
                  {link.name}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end leading-none mr-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</span>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-1">Citizen</span>
          </div>
          
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2 hidden sm:block" />

          <Link
            to="/citizen/profile"
            className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
            title="Profile"
          >
            <User size={18} />
          </Link>
          
          <ThemeToggle />
          
          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all dark:border-slate-800 dark:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
