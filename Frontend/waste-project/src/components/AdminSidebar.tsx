import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Route,
  Zap,
  Package,
  BarChart3,
  Clock,
  Users,
  Settings,
  Bell,
  Recycle,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useSidebar } from '@/contexts/SidebarContext'
import { useNavigate } from 'react-router-dom'

const menuItems = [
  {
    section: 'MAIN',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    ],
  },
  {
    section: 'MANAGEMENT',
    items: [
      { label: 'Reports', icon: FileText, path: '/admin/reports' },
      { label: 'Routes', icon: Route, path: '/admin/routes' },
      { label: 'Priority Queue', icon: Zap, path: '/admin/priority-queue' },
      { label: 'Collections', icon: Package, path: '/admin/collections' },
    ],
  },
  {
    section: 'ANALYTICS',
    items: [
      { label: 'Performance', icon: BarChart3, path: '/admin/performance' },
      { label: 'Activity Logs', icon: Clock, path: '/admin/activity-logs' },
    ],
  },
  {
    section: 'SYSTEM',
    items: [
      { label: 'Users', icon: Users, path: '/admin/users' },
      { label: 'Settings', icon: Settings, path: '/admin/settings' },
      { label: 'Notifications', icon: Bell, path: '/admin/notifications' },
    ],
  },
]

export function AdminSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { isOpen } = useSidebar()

  const isActive = (path: string) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={`bg-gray-950 text-gray-100 flex flex-col h-screen sticky top-0 overflow-hidden transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* ── Navigation ───────────────────────────────────── */}
      <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto scrollbar-none">
        {menuItems.map((section) => (
          <div key={section.section}>
            {isOpen && (
              <p className="px-3 mb-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                {section.section}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={!isOpen ? item.label : undefined}
                    className={`flex items-center gap-3 rounded-xl transition-all duration-150 ${
                      isOpen ? 'px-3 py-2.5' : 'justify-center py-2.5 px-0'
                    } ${
                      active
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-gray-400 hover:bg-gray-800/70 hover:text-gray-100'
                    }`}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {isOpen && <span className="text-sm font-medium">{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User Footer ──────────────────────────────────── */}
      <div className={`border-t border-gray-800/60 flex-shrink-0 ${isOpen ? 'p-4' : 'p-3'}`}>
        <div
          className={`flex items-center bg-gray-900 rounded-xl ${
            isOpen ? 'gap-3 px-3 py-3' : 'justify-center p-2.5'
          }`}
        >
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-sm text-white flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize mt-0.5">{user?.role}</p>
            </div>
          )}
          {isOpen && (
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
        {!isOpen && (
          <button
            onClick={handleLogout}
            title="Logout"
            className="w-full flex items-center justify-center mt-1.5 p-2 text-gray-600 hover:text-red-400 hover:bg-gray-800 rounded-xl transition-colors"
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </aside>
  )
}
