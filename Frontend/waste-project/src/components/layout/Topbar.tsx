import { Bell, Search, User, Sun, Moon, LogOut, Settings, User as UserIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { useState, useEffect } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Topbar() {
  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    if (newMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-8 z-30">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="font-bold">SW</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground hidden md:block">
            SmartWaste
          </span>
        </Link>

        <div className="relative w-64 lg:w-96 hidden sm:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Quick search..."
            className="w-full bg-muted/50 pl-9 focus-visible:ring-primary rounded-full border-none shadow-inner-soft"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-foreground"
          onClick={toggleTheme}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </Button>

        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell size={20} />
          <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
        </Button>
        
        <div className="h-6 w-px bg-border mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
                <UserIcon size={20} />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin/profile" className="cursor-pointer w-full">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/admin/settings" className="cursor-pointer w-full">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={() => logout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
