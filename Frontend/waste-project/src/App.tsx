import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { AdminRoute, CollectorRoute, CitizenRoute } from '@/components/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { CitizenDashboard } from '@/pages/CitizenDashboard'
import { CitizenReportForm } from '@/pages/CitizenReportForm'
import { CitizenReportsPage } from '@/pages/CitizenReportsPage'
import { CitizenProfile } from '@/pages/CitizenProfile'
import { CollectorDashboard } from '@/pages/CollectorDashboard'
import { AdminDashboard } from '@/pages/AdminDashboard'
import { UsersPage } from '@/pages/admin/UsersPage'
import { ReportsPage } from '@/pages/admin/ReportsPage'
import { RoutesPage } from '@/pages/admin/RoutesPage'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import './App.css'
import HomePage from '@/pages/HomePage'

export default function App() {
  return (
    <Router>
      <ErrorBoundary>
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
            path="/citizen/report"
            element={
              <CitizenRoute>
                <CitizenReportForm />
              </CitizenRoute>
            }
          />

          <Route
            path="/citizen/reports"
            element={
              <CitizenRoute>
                <CitizenReportsPage />
              </CitizenRoute>
            }
          />

          <Route
            path="/citizen/profile"
            element={
              <CitizenRoute>
                <CitizenProfile />
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

          <Route
            path="/admin/reports"
            element={
              <AdminRoute>
                <ReportsPage />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/routes"
            element={
              <AdminRoute>
                <RoutesPage />
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
      </ErrorBoundary>
      <ToastContainer />
    </Router>
  )
}
