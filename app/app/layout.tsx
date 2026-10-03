import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Sidebar from '@/components/app/Sidebar'
import { ThemeProvider } from '@/components/app/ThemeProvider'

export const metadata = {
  title: 'FlashGenius — App',
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-gray-50 dark:bg-[#050510] text-gray-900 dark:text-white">
        <Sidebar user={session.user} />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>
    </ThemeProvider>
  )
}
