import { Bell, Search, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'

export function Topbar() {
  const user = useAuthStore(state => state.user)

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-8">
      <div className="flex w-96 items-center gap-2">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search reports, users, or locations..."
            className="w-full bg-muted/50 pl-9 focus-visible:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell size={20} />
          <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-primary" />
        </Button>
        
        <div className="h-8 w-px bg-border" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-foreground">{user?.name}</p>
            <p className="text-xs font-medium text-muted-foreground capitalize">{user?.role}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  )
}
