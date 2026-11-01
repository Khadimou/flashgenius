import Link from 'next/link'

export const AUTH_INPUT = 'w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all'
export const AUTH_BTN = 'w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 transition-all'

export default function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050510] flex items-center justify-center px-4 py-10">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-950/40 blur-[120px]" />
      </div>
      <div className="relative z-10 w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 justify-center mb-10 hover:opacity-75 transition-opacity">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-black">F</div>
          <span className="font-bold text-xl text-white">FlashGenius</span>
        </Link>
        <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
          <h1 className="text-2xl font-bold text-white mb-6">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  )
}
