'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Folder { id: string; name: string }

interface DeckInfo {
  id: string
  name: string
  cardCount: number
  dueCount: number
  updatedAt: string
  folderId?: string | null
}

interface Props {
  deck: DeckInfo
  folders: Folder[]
}

export default function DeckCardWithMove({ deck, folders }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const due = deck.dueCount

  async function move(folderId: string | null) {
    setLoading(true)
    await fetch('/api/decks/' + deck.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId }),
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <div className="relative">
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

      {/* Move button — visible on hover */}
      <div className="absolute top-2 right-2">
        <button
          onClick={(e) => { e.preventDefault(); setOpen((o) => !o) }}
          disabled={loading}
          title="Déplacer dans un dossier"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 dark:text-white/30 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 opacity-0 group-hover:opacity-100 transition-all text-xs border border-transparent hover:border-violet-200 dark:hover:border-violet-500/20">
          📁
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-1 z-20 min-w-[180px] bg-white dark:bg-[#0f0f1a] border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-xl overflow-hidden">
              <p className="px-3 py-2 text-[10px] font-semibold text-gray-400 dark:text-white/25 uppercase tracking-wider border-b border-gray-100 dark:border-white/[0.05]">
                Déplacer vers
              </p>
              {deck.folderId && (
                <button
                  onClick={() => move(null)}
                  className="w-full text-left px-3 py-2.5 text-sm text-gray-500 dark:text-white/40 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors flex items-center gap-2 border-b border-gray-100 dark:border-white/[0.05]">
                  ✕ Retirer du dossier
                </button>
              )}
              {folders.length === 0 ? (
                <p className="px-3 py-3 text-xs text-gray-400 dark:text-white/30">
                  Aucun dossier — crée-en un d&apos;abord
                </p>
              ) : (
                folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => move(f.id)}
                    className={'w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center gap-2 ' + (
                      f.id === deck.folderId
                        ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10'
                        : 'text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                    )}>
                    <span>📁</span> {f.name}
                    {f.id === deck.folderId && <span className="ml-auto text-xs">✓</span>}
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
