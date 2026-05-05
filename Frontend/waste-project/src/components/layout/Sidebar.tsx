import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  Map, 
  Bell,
  Trash2,
  ChevronLeft
} from 'lucide-react'
import { cn } from '@/utils'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { useState } from 'react'

interface SidebarProps {
  className?: string
}

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, href: '/admin' },
  { label: 'Reports', icon: FileText, href: '/admin/reports' },
  { label: 'User Management', icon: Users, href: '/admin/users' },
  { label: 'Route Planning', icon: Map, href: '/admin/routes' },
  { label: 'Notifications', icon: Bell, href: '/admin/notifications' },
  { label: 'Settings', icon: Settings, href: '/admin/settings' },
]

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation()
  const logout = useAuthStore(state => state.logout)
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside 
      className={cn(
        "relative flex flex-col border-r bg-card transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64",
        className
      )}
    >
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Trash2 size={18} />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold tracking-tight text-foreground">
              SmartWaste
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                isCollapsed && "justify-center px-2"
              )}
            >
              <item.icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
              {!isCollapsed && <span>{item.label}</span>}
              {isActive && !isCollapsed && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            isCollapsed && "justify-center px-2"
          )}
          onClick={logout}
        >
          <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>

      <Button
        role="button"
        tabIndex={0}
        variant="ghost"
        size="icon"
        className="absolute -right-4 top-20 hidden h-8 w-8 rounded-full border bg-background lg:flex"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
      </Button>
    </aside>
  )
}
