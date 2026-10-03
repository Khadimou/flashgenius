'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'
type Resolved = 'light' | 'dark'

interface Ctx { theme: Theme; setTheme: (t: Theme) => void; resolved: Resolved }
const ThemeCtx = createContext<Ctx>({ theme:'dark', setTheme:()=>{}, resolved:'dark' })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [resolved, setResolved] = useState<Resolved>('dark')

  function apply(t: Theme) {
    const dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', dark)
    setResolved(dark ? 'dark' : 'light')
  }

  useEffect(() => {
    const stored = (localStorage.getItem('fg-theme') as Theme) ?? 'dark'
    setThemeState(stored)
    apply(stored)
  }, [])

  function setTheme(t: Theme) {
    setThemeState(t)
    localStorage.setItem('fg-theme', t)
    apply(t)
  }

  return <ThemeCtx.Provider value={{ theme, setTheme, resolved }}>{children}</ThemeCtx.Provider>
}

export const useTheme = () => useContext(ThemeCtx)
