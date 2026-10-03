'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useTheme } from './ThemeProvider'

interface User { name?: string | null; email?: string | null }

const NAV = [
  { href:'/app', label:'Tableau de bord', icon:'🏠', exact:true },
  { href:'/app/generate', label:'Generer', icon:'⚡', exact:false },
  { href:'/app/library', label:'Bibliotheque', icon:'📚', exact:false },
  { href:'/app/sr', label:'Revision SR', icon:'🧠', exact:false },
]

const THEMES = [
  { value:'light', label:'☀️' },
  { value:'dark',  label:'🌙' },
  { value:'system',label:'💻' },
] as const

export default function Sidebar({ user }: { user: User }) {
  const path = usePathname()
  const { theme, setTheme } = useTheme()

  function isActive(href: string, exact: boolean) {
    return exact ? path === href : path.startsWith(href)
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 h-screen shrink-0 border-r border-white/[0.06] dark:border-white/[0.06] bg-[#070714] dark:bg-[#070714]">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-white/[0.06]">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-black text-white">F</div>
          <span className="font-bold text-white">FlashGenius</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}
              className={'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ' + (
                isActive(n.href, n.exact)
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
              )}>
              <span>{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/[0.06] space-y-3">
          {/* Theme toggle */}
          <div className="flex items-center gap-1 px-3">
            {THEMES.map((t) => (
              <button key={t.value} onClick={() => setTheme(t.value)} title={t.value}
                className={'flex-1 py-1.5 rounded-lg text-sm transition-all ' + (
                  theme === t.value
                    ? 'bg-violet-600/30 text-violet-300'
                    : 'text-white/30 hover:text-white/60 hover:bg-white/[0.05]'
                )}>
                {t.label}
              </button>
            ))}
          </div>

          {/* User */}
          <div className="flex items-center gap-2 px-3">
            <div className="w-7 h-7 rounded-full bg-violet-600/30 flex items-center justify-center text-xs text-violet-300 font-bold shrink-0">
              {(user.name ?? user.email ?? '?')[0].toUpperCase()}
            </div>
            <span className="text-white/40 text-xs truncate flex-1">{user.email}</span>
            <button onClick={() => signOut({ callbackUrl: '/' })} title="Deconnexion"
              className="text-white/25 hover:text-white/60 text-xs transition-colors">↩</button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex border-t border-white/[0.06] bg-[#070714]/95 backdrop-blur-sm">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href}
            className={'flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ' + (
              isActive(n.href, n.exact) ? 'text-violet-400' : 'text-white/35 hover:text-white/60'
            )}>
            <span className="text-lg">{n.icon}</span>
            <span className="hidden xs:block">{n.label.split(' ')[0]}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
