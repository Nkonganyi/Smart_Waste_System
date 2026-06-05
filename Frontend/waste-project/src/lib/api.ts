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
  // Send as JSON — image is pre-uploaded via uploadAPI.uploadImages() and passed as image_url string
  create: (data: { title: string; location: string; description: string; priority: string; image_url?: string; image_urls?: string[] }) =>
    apiClient.post('/reports', data),
  getMyReports: () =>
    apiClient.get('/reports/my'),
  getLocationSuggestions: (query: string) =>
    apiClient.get('/reports/location-suggestions', { params: { q: query } }),
  getPublicHomepageSummary: () =>
    apiClient.get('/reports/public-summary'),
  getAllReports: () =>
    apiClient.get('/reports'),
  getAssignedReports: () =>
    apiClient.get('/reports/assigned'),
  getAssignedRoute: () =>
    apiClient.get('/reports/assigned/route'),
  geocodeLocation: (location: string) =>
    apiClient.post('/reports/geocode', { location }),
  startReport: (reportId: string) =>
    apiClient.put('/reports/start', { report_id: reportId }),
  completeReport: (reportId: string, completionImageUrl: string) =>
    apiClient.put('/reports/complete', { report_id: reportId, completion_image_url: completionImageUrl }),
  rejectAssignment: (reportId: string) =>
    apiClient.put('/reports/reject-assignment', { report_id: reportId }),
  updateReportCoords: (reportId: string, latitude: number, longitude: number) =>
    apiClient.put('/reports/coords', { report_id: reportId, latitude, longitude }),
  // Calls the correct backend route PUT /api/reports/status
  updateStatus: (reportId: string, status: string) =>
    apiClient.put('/reports/status', { report_id: reportId, status }),
  // Uses snake_case keys expected by the backend assignCollector handler
  assignCollector: (reportId: string, collectorId: string) =>
    apiClient.post('/reports/assign', { report_id: reportId, collector_id: collectorId }),
  approveReport: (reportId: string) =>
    apiClient.put('/reports/approve', { report_id: reportId }),
  rejectReport: (reportId: string, reason?: string) =>
    apiClient.put('/reports/reject', { report_id: reportId, reason }),
  getCollectors: () =>
    apiClient.get('/reports/collectors'),
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

// Notifications API
export const notificationsAPI = {
  getMyNotifications: () =>
    apiClient.get('/notifications'),
  getAllNotifications: () =>
    apiClient.get('/notifications/all'),
  markAsRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () =>
    apiClient.patch('/notifications/read-all'),
}

// Routes API
export const routesAPI = {
  optimizeRoute: (locations: any[]) =>
    apiClient.post('/routes/optimize', { locations }),
  getAllRoutes: () =>
    apiClient.get('/routes/all'),
}

// Scheduling API
export const schedulingAPI = {
  getPrioritizedReports: () =>
    apiClient.get('/schedule/prioritized'),
}

const uploadImages = (files: File[], onUploadProgress?: (progress: number) => void) => {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))

  return apiClient.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        onUploadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100))
      }
    },
  })
}

export const userAPI = {
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (data: { name?: string; phone?: string; address?: string }) => apiClient.put('/users/profile', data),
}

export const uploadAPI = {
  uploadImages,
  uploadImage: (file: File, onUploadProgress?: (progress: number) => void) =>
    uploadImages([file], onUploadProgress).then((response) => {
      if (Array.isArray(response.data?.urls)) {
        return { data: { url: response.data.urls[0] } }
      }
      return { data: { url: response.data.url } }
    }),
}
