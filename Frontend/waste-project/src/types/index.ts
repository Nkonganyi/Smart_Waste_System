export type UserRole = 'citizen' | 'collector' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  created_at: string
  is_verified?: boolean
  is_suspended?: boolean
}

export interface Report {
  id: string
  title: string
  description: string
  location: string
  latitude: number
  longitude: number
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  image_url?: string
  created_at: string
  user_id: string
  collector_id?: string
  parent_report_id?: string
}

export interface AdminStats {
  totalReports: number
  pending: number
  inProgress: number
  completed: number
  totalUsers: number
  collectors: number
  highPriority: number
  efficiency: number
}
