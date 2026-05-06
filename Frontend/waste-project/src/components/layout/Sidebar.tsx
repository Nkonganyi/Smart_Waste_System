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
  ChevronLeft,
  ListOrdered,
  Truck,
  BarChart3,
  History,
  User as UserIcon
} from 'lucide-react'
import { cn } from '@/utils'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { useState } from 'react'

interface SidebarProps {
  className?: string
}

interface NavItem {
  label: string
  icon: any
  href: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'MAIN',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    ]
  },
  {
    title: 'MANAGEMENT',
    items: [
      { label: 'Reports', icon: FileText, href: '/admin/reports' },
      { label: 'Routes', icon: Map, href: '/admin/routes' },
      { label: 'Priority Queue', icon: ListOrdered, href: '/admin/priority' },
      { label: 'Collections', icon: Truck, href: '/admin/collections' },
    ]
  },
  {
    title: 'ANALYTICS',
    items: [
      { label: 'Performance', icon: BarChart3, href: '/admin/performance' },
      { label: 'Activity Logs', icon: History, href: '/admin/activity' },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'Users', icon: Users, href: '/admin/users' },
      { label: 'Notifications', icon: Bell, href: '/admin/notifications' },
      { label: 'Settings', icon: Settings, href: '/admin/settings' },
    ]
  }
]

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation()
  const logout = useAuthStore(state => state.logout)
  const user = useAuthStore(state => state.user)
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside 
      className={cn(
        "relative flex flex-col border-r bg-card transition-all duration-300 ease-in-out z-40",
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

      <nav className="flex-1 overflow-y-auto space-y-6 px-3 py-4 custom-scrollbar">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!isCollapsed && (
              <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      isCollapsed && "justify-center px-2"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <item.icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
                    {!isCollapsed && <span>{item.label}</span>}
                    {isActive && !isCollapsed && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t p-4">
        <div className={cn(
          "mb-4 flex items-center gap-3 rounded-xl bg-muted/50 p-3",
          isCollapsed && "justify-center px-2"
        )}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
            <UserIcon size={20} />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-semibold text-foreground">{user?.name}</span>
              <span className="truncate text-xs text-muted-foreground capitalize">{user?.role}</span>
            </div>
          )}
        </div>
        
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
        className="absolute -right-4 top-20 hidden h-8 w-8 rounded-full border bg-background lg:flex z-50 shadow-sm hover:shadow-md"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
      </Button>
    </aside>
  )
}
