import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) return null

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-gray-900">
            🚛 Smart Waste System
          </Link>

          <div className="hidden md:flex space-x-8">
            {user.role === 'admin' && (
              <>
                <Link to="/" className="text-gray-700 hover:text-gray-900">
                  Dashboard
                </Link>
              </>
            )}
            {user.role === 'collector' && (
              <>
                <Link to="/" className="text-gray-700 hover:text-gray-900">
                  My Routes
                </Link>
              </>
            )}
            {user.role === 'citizen' && (
              <>
                <Link to="/" className="text-gray-700 hover:text-gray-900">
                  Dashboard
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-gray-700 text-sm">{user.name}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
