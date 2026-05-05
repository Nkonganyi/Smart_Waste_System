import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Navbar } from '@/components/Navbar'
import { AdminRoute, CollectorRoute, CitizenRoute } from '@/components/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { CitizenDashboard } from '@/pages/CitizenDashboard'
import { CollectorDashboard } from '@/pages/CollectorDashboard'
import { AdminDashboard } from '@/pages/AdminDashboard'
import { UsersPage } from '@/pages/admin/UsersPage'
import { ToastContainer } from '@/components/ui/ToastContainer'
import './App.css'

function HomePage() {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-green-500">
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-4">Smart Waste System</h1>
          <p className="text-xl mb-8">Efficient waste management and logistics optimization</p>
          <div className="space-x-4">
            <a href="/login" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100">
              Sign In
            </a>
            <a href="/register" className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800">
              Sign Up
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Redirect to appropriate dashboard based on role
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }
  if (user?.role === 'collector') {
    return <Navigate to="/collector" replace />
  }
  return <Navigate to="/citizen" replace />
}

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/citizen"
          element={
            <CitizenRoute>
              <CitizenDashboard />
            </CitizenRoute>
          }
        />

        <Route
          path="/collector"
          element={
            <CollectorRoute>
              <CollectorDashboard />
            </CollectorRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <UsersPage />
            </AdminRoute>
          }
        />

        {/* Catch-all for other admin sub-pages */}
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <div className="flex h-[80vh] items-center justify-center text-center">
                <div className="space-y-4">
                  <h2 className="text-4xl font-bold tracking-tight">Coming Soon</h2>
                  <p className="text-xl text-muted-foreground">This section is currently under construction.</p>
                </div>
              </div>
            </AdminRoute>
          }
        />
      </Routes>
      <ToastContainer />
    </Router>
  )
}
