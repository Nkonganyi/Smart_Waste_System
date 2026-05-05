import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, User, Moon, Sun, Search, LogOut, Menu } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useSidebar } from '@/contexts/SidebarContext'

export function AdminTopbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { toggleSidebar } = useSidebar()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
    // TODO: Apply theme to entire application
  }

  return (
    <nav className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
      {/* Left side — Sidebar Toggle + Portal label */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Toggle sidebar"
        >
          <Menu size={22} className="text-gray-600" />
        </button>
        <span className="text-sm font-semibold text-gray-500 hidden sm:inline tracking-wide">
          Waste Management System
        </span>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-6">
        {/* Search Bar */}
        <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2 w-64">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search reports, routes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent ml-2 text-sm outline-none w-full text-gray-700 placeholder-gray-500"
          />
        </div>

        {/* Notifications */}
        <button title="Notifications" className="relative p-2 hover:bg-gray-100 rounded-lg transition">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          title="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon size={20} className="text-gray-600" />
          ) : (
            <Sun size={20} className="text-gray-600" />
          )}
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:inline">{user?.name}</span>
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <a
                href="#"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                <User size={16} />
                View Profile
              </a>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition border-t border-gray-200"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
