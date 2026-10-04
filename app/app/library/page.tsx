import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DeckCard from '@/components/app/DeckCard'
import FolderManager from '@/components/app/FolderManager'

export const revalidate = 0

export default async function LibraryPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const [decks, folders] = await Promise.all([
    prisma.deck.findMany({
      where: { userId: session.user.id },
      include: {
        folder: { select: { id: true, name: true } },
        _count: { select: { cards: true } },
        cards: { select: { dueDate: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.folder.findMany({
      where: { userId: session.user.id },
      orderBy: { name: 'asc' },
    }),
  ])

  const byFolder: Record<string, typeof decks> = { '': [] }
  folders.forEach((f) => { byFolder[f.id] = [] })
  decks.forEach((d) => {
    const key = d.folderId ?? ''
    if (!byFolder[key]) byFolder[key] = []
    byFolder[key].push(d)
  })

  const now = new Date()
  function dueCount(d: (typeof decks)[0]) {
    return d.cards.filter((c) => new Date(c.dueDate) <= now).length
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📚 Bibliotheque</h1>
          <p className="text-gray-500 dark:text-white/40 mt-1 text-sm">
            {decks.length} deck{decks.length > 1 ? 's' : ''} · {decks.reduce((s, d) => s + d._count.cards, 0)} cartes
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <FolderManager folders={folders} />
          <Link href="/app/generate"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all">
            ⚡ Nouveau deck
          </Link>
        </div>
      </div>

      {decks.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-500 dark:text-white/40">Aucun deck pour l'instant.</p>
          <Link href="/app/generate"
            className="inline-block mt-4 px-6 py-3 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors">
            Creer mon premier deck →
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Decks sans dossier */}
          {byFolder[''].length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-gray-400 dark:text-white/30 uppercase tracking-widest mb-3">Sans dossier</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {byFolder[''].map((d) => (
                  <DeckCard key={d.id} deck={{ id: d.id, name: d.name, cardCount: d._count.cards, dueCount: dueCount(d), updatedAt: d.updatedAt.toISOString() }} />
                ))}
              </div>
            </section>
          )}

          {/* Decks par dossier */}
          {folders.map((f) => byFolder[f.id]?.length > 0 && (
            <section key={f.id}>
              <h2 className="text-xs font-bold text-gray-400 dark:text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span>📁</span> {f.name}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {byFolder[f.id].map((d) => (
                  <DeckCard key={d.id} deck={{ id: d.id, name: d.name, cardCount: d._count.cards, dueCount: dueCount(d), updatedAt: d.updatedAt.toISOString() }} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
