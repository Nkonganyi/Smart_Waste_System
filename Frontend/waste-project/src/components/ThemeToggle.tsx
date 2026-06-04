import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldUseDark = savedTheme ? savedTheme === 'dark' : prefersDark

    const root = document.documentElement
    root.classList.toggle('dark', shouldUseDark)
    setIsDarkMode(shouldUseDark)
  }, [])

  const toggleTheme = () => {
    const root = document.documentElement
    const newMode = !root.classList.contains('dark')
    root.classList.toggle('dark', newMode)
    setIsDarkMode(newMode)
    localStorage.setItem('theme', newMode ? 'dark' : 'light')
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  )
}
