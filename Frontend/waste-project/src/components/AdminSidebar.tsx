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
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useSidebar } from '@/contexts/SidebarContext'

export function AdminSidebar() {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const { isOpen } = useSidebar()

  const isActive = (path: string) => location.pathname === path

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

  return (
    <aside className={`bg-gray-900 text-gray-100 flex flex-col h-screen sticky top-0 overflow-hidden transition-all duration-300 ${
      isOpen ? 'w-64' : 'w-20'
    }`}>
      {/* Menu Items */}
      <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
        {menuItems.map((section) => (
          <div key={section.section}>
            {/* Section Header - Always Visible */}
            <div className={`px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider ${
              !isOpen && 'hidden'
            }`}>
              {section.section}
            </div>

            {/* Section Items */}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={!isOpen ? item.label : ''}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                    } ${!isOpen && 'justify-center'}`}
                  >
                    <Icon size={20} />
                    {isOpen && <span className="text-sm">{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-700">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center'} mb-2`}>
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
              </div>
            )}
          </div>
          {isOpen && (
            <button className="w-full text-xs text-gray-400 hover:text-gray-200 transition text-left py-1">
              View Profile
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
