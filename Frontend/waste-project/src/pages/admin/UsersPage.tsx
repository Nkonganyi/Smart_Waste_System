import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  UserPlus, 
  MoreVertical, 
  Shield, 
  UserCheck, 
  UserX,
  Mail
} from 'lucide-react'
import type { User } from '@/types'
import apiClient from '@/lib/apiClient'
import { formatDate } from '@/utils'

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiClient.get('/admin/users')
        setUsers(response.data)
      } catch (err) {
        console.error('Failed to fetch users:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">Manage system users, roles, and permissions.</p>
          </div>
          <Button className="w-fit gap-2">
            <UserPlus size={18} />
            Add User
          </Button>
        </div>

        <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-soft">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline">Filters</Button>
        </div>

        <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[300px]">User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <TableRow key={i}>
                    <TableCell><div className="h-10 w-48 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-6 w-20 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-6 w-24 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-6 w-32 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="ml-auto h-8 w-8 animate-pulse rounded bg-muted" /></TableCell>
                  </TableRow>
                ))
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No users found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="group transition-colors hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{user.name}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail size={12} />
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.role === 'admin' ? (
                          <Shield size={14} className="text-primary" />
                        ) : (
                          <UserCheck size={14} className="text-muted-foreground" />
                        )}
                        <span className="capitalize text-sm font-medium">{user.role}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.is_suspended ? (
                        <Badge variant="destructive" className="gap-1">
                          <UserX size={12} />
                          Suspended
                        </Badge>
                      ) : (
                        <Badge variant="success" className="gap-1">
                          <UserCheck size={12} />
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical size={18} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  )
}
