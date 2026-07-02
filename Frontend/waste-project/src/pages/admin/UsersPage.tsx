import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Search, MoreVertical, Shield, UserCheck, UserX, Mail, Loader2, RefreshCw, ShieldCheck
} from 'lucide-react'
import type { User } from '@/types'
import { userAPI } from '@/lib/api'
import { useToastStore } from '@/stores/toastStore'
import { formatDate } from '@/utils'

type Action = 'suspend' | 'unsuspend' | 'verify'

export function UsersPage() {
  const addToast = useToastStore((s) => s.addToast)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  // Confirmation dialog
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<{ action: Action; user: User } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await userAPI.getAllUsers()
      setUsers(response.data)
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Failed to fetch users.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const openConfirm = (action: Action, user: User) => {
    setPendingAction({ action, user })
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    if (!pendingAction) return
    const { action, user } = pendingAction
    setActionLoading(true)
    try {
      if (action === 'suspend') {
        await userAPI.suspendUser(user.id)
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_suspended: true } : u))
        addToast(`${user.name} has been suspended.`, 'success')
      } else if (action === 'unsuspend') {
        await userAPI.unsuspendUser(user.id)
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_suspended: false } : u))
        addToast(`${user.name}'s account has been reactivated.`, 'success')
      } else if (action === 'verify') {
        await userAPI.verifyUser(user.id)
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_verified: true } : u))
        addToast(`${user.name}'s email has been verified.`, 'success')
      }
      setConfirmOpen(false)
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Action failed. Please try again.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const actionLabel: Record<Action, string> = {
    suspend: 'Suspend',
    unsuspend: 'Reactivate',
    verify: 'Verify email',
  }
  const actionDescription: Record<Action, string> = {
    suspend: 'This will block the user from logging in immediately.',
    unsuspend: 'This will allow the user to log in again.',
    verify: 'This will manually mark the user\'s email as verified.',
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">

        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              {loading ? 'Loading...' : `${users.length} total users`}
            </p>
          </div>
          <Button variant="outline" onClick={fetchUsers} disabled={loading} className="w-fit gap-2">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>

        {/* Search + filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center rounded-xl border bg-card p-4 shadow-soft">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'citizen', 'collector', 'admin'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  roleFilter === role
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[280px]">User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    {[280, 80, 90, 90, 100, 60].map((w, j) => (
                      <TableCell key={j}>
                        <div className={`h-6 w-${w === 280 ? '48' : '16'} animate-pulse rounded bg-muted`} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="group transition-colors hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-foreground truncate">{user.name}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail size={11} />
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.role === 'admin' ? (
                          <Shield size={13} className="text-primary" />
                        ) : (
                          <UserCheck size={13} className="text-muted-foreground" />
                        )}
                        <span className="capitalize text-sm font-medium">{user.role}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.is_verified ? (
                        <Badge variant="success" className="gap-1">
                          <ShieldCheck size={11} />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="gap-1">
                          <Mail size={11} />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.is_suspended ? (
                        <Badge variant="destructive" className="gap-1">
                          <UserX size={11} />
                          Suspended
                        </Badge>
                      ) : (
                        <Badge variant="success" className="gap-1">
                          <UserCheck size={11} />
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          {!user.is_verified && (
                            <DropdownMenuItem onClick={() => openConfirm('verify', user)} className="gap-2">
                              <ShieldCheck size={14} />
                              Verify email
                            </DropdownMenuItem>
                          )}
                          {!user.is_verified && <DropdownMenuSeparator />}
                          {user.is_suspended ? (
                            <DropdownMenuItem
                              onClick={() => openConfirm('unsuspend', user)}
                              className="gap-2 text-emerald-600 focus:text-emerald-600"
                            >
                              <UserCheck size={14} />
                              Reactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => openConfirm('suspend', user)}
                              className="gap-2 text-destructive focus:text-destructive"
                            >
                              <UserX size={14} />
                              Suspend user
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={(open) => { if (!actionLoading) setConfirmOpen(open) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction ? actionLabel[pendingAction.action] + ' user' : ''}
            </DialogTitle>
            <DialogDescription>
              {pendingAction
                ? `${actionDescription[pendingAction.action]} Are you sure you want to ${actionLabel[pendingAction.action].toLowerCase()} ${pendingAction.user.name}?`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={actionLoading}
              variant={pendingAction?.action === 'suspend' ? 'destructive' : 'default'}
              className="gap-2"
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {pendingAction ? actionLabel[pendingAction.action] : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
