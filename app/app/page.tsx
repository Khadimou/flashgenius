import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DeckCard from '@/components/app/DeckCard'

export const revalidate = 0

export default async function AppDashboard() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const decks = await prisma.deck.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { cards: true } },
      cards: { select: { dueDate: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 6,
  })

  const now = new Date()
  const totalDue = decks.reduce((s, d) => s + d.cards.filter((c) => new Date(c.dueDate) <= now).length, 0)
  const totalDecks = decks.length
  const totalCards = decks.reduce((s, d) => s + d._count.cards, 0)

  function dueCount(d: (typeof decks)[0]) {
    return d.cards.filter((c) => new Date(c.dueDate) <= now).length
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Bonjour{session.user.name ? ', ' + session.user.name.split(' ')[0] : ''} 👋
        </h1>
        <p className="text-gray-500 dark:text-white/40 mt-1 text-sm">
          {totalDue > 0 ? `${totalDue} carte${totalDue > 1 ? 's' : ''} a reviser aujourd'hui.` : 'Tout est a jour !'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07]">
          <p className={'text-3xl font-bold ' + (totalDue > 0 ? 'text-amber-500' : 'text-emerald-500')}>{totalDue}</p>
          <p className="text-xs text-gray-400 dark:text-white/30 mt-1">A reviser</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07]">
          <p className="text-3xl font-bold text-violet-500">{totalDecks}</p>
          <p className="text-xs text-gray-400 dark:text-white/30 mt-1">Decks</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07]">
          <p className="text-3xl font-bold text-indigo-500">{totalCards}</p>
          <p className="text-xs text-gray-400 dark:text-white/30 mt-1">Cartes</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 mb-8 flex-wrap">
        <Link href="/app/generate"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all">
          ⚡ Generer un deck
        </Link>
        {totalDue > 0 && (
          <Link href="/app/sr"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all">
            🧠 {totalDue} a reviser
          </Link>
        )}
      </div>

      {/* Recent decks */}
      {decks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700 dark:text-white/70 text-sm">Decks recents</h2>
            <Link href="/app/library" className="text-xs text-violet-500 hover:underline">Voir tout →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {decks.map((d) => (
              <DeckCard key={d.id} deck={{ id: d.id, name: d.name, cardCount: d._count.cards, dueCount: dueCount(d), updatedAt: d.updatedAt.toISOString() }} />
            ))}
          </div>
        </div>
      )}

      {decks.length === 0 && (
        <div className="text-center py-16 rounded-2xl bg-white dark:bg-white/[0.03] border border-dashed border-gray-200 dark:border-white/[0.07]">
          <div className="text-4xl mb-3">✨</div>
          <p className="text-gray-500 dark:text-white/40 mb-4">Cree ton premier deck pour commencer.</p>
          <Link href="/app/generate"
            className="inline-block px-6 py-3 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors">
            ⚡ Generer des flashcards →
          </Link>
        </div>
      )}
    </div>
  )
}
