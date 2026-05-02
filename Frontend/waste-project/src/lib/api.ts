import apiClient from '@/lib/apiClient'

// Auth API
export const authAPI = {
  register: (data: { name: string; email: string; password: string; role: string }) =>
    apiClient.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),
  verifyEmail: (token: string) =>
    apiClient.get('/auth/verify-email', { params: { token } }),
  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, password }),
  logout: () => apiClient.post('/auth/logout'),
}

// Reports API
export const reportsAPI = {
  create: (data: FormData) =>
    apiClient.post('/reports', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyReports: () =>
    apiClient.get('/reports/my'),
  getAllReports: () =>
    apiClient.get('/reports'),
  getAssignedReports: () =>
    apiClient.get('/reports/assigned'),
  updateReport: (reportId: string, data: any) =>
    apiClient.put(`/reports/${reportId}`, data),
  assignCollector: (reportId: string, collectorId: string) =>
    apiClient.post('/reports/assign', { reportId, collectorId }),
}

// Dashboard API
export const dashboardAPI = {
  getAdminStats: () =>
    apiClient.get('/dashboard/admin'),
  getReportsPerLocation: () =>
    apiClient.get('/dashboard/locations'),
  getCollectorWorkload: () =>
    apiClient.get('/dashboard/collectors'),
  getReportTrends: (days?: number) =>
    apiClient.get('/dashboard/trends', { params: { days } }),
}

// Routes API
export const routesAPI = {
  optimizeRoute: (locations: any[]) =>
    apiClient.post('/routes/optimize', { locations }),
}

// Scheduling API
export const schedulingAPI = {
  getPrioritizedReports: () =>
    apiClient.get('/schedule/prioritized'),
}

// Upload API
export const uploadAPI = {
  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
