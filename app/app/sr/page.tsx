import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SRExplainer from '@/components/app/SRExplainer'

export const revalidate = 0

export default async function SRDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const decks = await prisma.deck.findMany({
    where: { userId: session.user.id },
    include: { cards: { select: { dueDate: true, easeFactor: true } } },
    orderBy: { updatedAt: 'desc' },
  })

  const now = new Date()
  const totalDue = decks.reduce((s, d) => s + d.cards.filter((c) => new Date(c.dueDate) <= now).length, 0)
  const totalCards = decks.reduce((s, d) => s + d.cards.length, 0)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🧠 Revision espacee</h1>
        <p className="text-gray-500 dark:text-white/40 mt-1 text-sm">Algorithme SM-2 — Les cartes les plus difficiles en premier.</p>
      </div>

      {/* Explainer */}
      <SRExplainer />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07]">
          <p className={'text-3xl font-bold ' + (totalDue > 0 ? 'text-amber-500' : 'text-emerald-500')}>{totalDue}</p>
          <p className="text-xs text-gray-400 dark:text-white/30 mt-1">A reviser aujourd&apos;hui</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07]">
          <p className="text-3xl font-bold text-violet-500">{decks.length}</p>
          <p className="text-xs text-gray-400 dark:text-white/30 mt-1">Decks</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07]">
          <p className="text-3xl font-bold text-indigo-500">{totalCards}</p>
          <p className="text-xs text-gray-400 dark:text-white/30 mt-1">Cartes totales</p>
        </div>
      </div>

      {decks.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 dark:text-white/30 mb-4">Aucun deck pour l&apos;instant.</p>
          <Link href="/app/generate" className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors">
            Creer un deck →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {decks.map((d) => {
            const due = d.cards.filter((c) => new Date(c.dueDate) <= now).length
            const total = d.cards.length
            return (
              <div key={d.id} className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] hover:border-violet-200 dark:hover:border-violet-500/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className={'w-2 h-2 rounded-full shrink-0 ' + (due > 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400')} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{d.name}</p>
                    <p className="text-xs text-gray-400 dark:text-white/30">{total} carte{total > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {due > 0 ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold">
                      {due} a reviser
                    </span>
                  ) : (
                    <span className="text-emerald-500 text-xs font-medium">✅ A jour</span>
                  )}
                  <Link href={'/app/sr/' + d.id}
                    className={'px-4 py-2 rounded-xl text-sm font-semibold transition-all ' + (
                      due > 0
                        ? 'text-white bg-violet-600 hover:bg-violet-500'
                        : 'text-gray-500 dark:text-white/40 border border-gray-200 dark:border-white/10 hover:border-violet-400 dark:hover:border-violet-500/30'
                    )}>
                    {due > 0 ? 'Reviser →' : 'Forcer'}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
