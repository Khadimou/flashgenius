import Link from 'next/link'

interface DeckInfo {
  id: string
  name: string
  cardCount: number
  dueCount: number
  updatedAt: string
}

export default function DeckCard({ deck }: { deck: DeckInfo }) {
  const due = deck.dueCount
  return (
    <Link href={'/app/deck/' + deck.id}
      className="block p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] hover:border-violet-300 dark:hover:border-violet-500/30 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all group">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">{deck.name}</h3>
        {due > 0 && (
          <span className="shrink-0 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold">
            {due}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-white/30">
        <span>{deck.cardCount} carte{deck.cardCount > 1 ? 's' : ''}</span>
        <span>{due > 0 ? `${due} a reviser` : '✅ A jour'}</span>
      </div>
    </Link>
  )
}
