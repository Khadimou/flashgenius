'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Folder { id: string; name: string }

interface Props {
  deckId: string
  currentFolderId?: string | null
  folders: Folder[]
}

export default function DeckFolderPicker({ deckId, currentFolderId, folders }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const current = folders.find((f) => f.id === currentFolderId)

  async function move(folderId: string | null) {
    setLoading(true)
    await fetch('/api/decks/' + deckId, {
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
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-500 dark:text-white/40 border border-gray-200 dark:border-white/10 hover:border-violet-400 dark:hover:border-violet-500/40 hover:text-violet-600 dark:hover:text-violet-400 transition-all bg-white dark:bg-transparent">
        <span>📁</span>
        <span className="max-w-[100px] truncate">{current ? current.name : 'Dossier'}</span>
        <svg className={'w-3 h-3 transition-transform ' + (open ? 'rotate-180' : '')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div className="absolute left-0 top-full mt-1 z-20 min-w-[180px] bg-white dark:bg-[#0f0f1a] border border-gray-200 dark:border-white/[0.08] rounded-xl shadow-xl overflow-hidden">
            {folders.length === 0 ? (
              <p className="px-4 py-3 text-xs text-gray-400 dark:text-white/30">Aucun dossier créé</p>
            ) : (
              <>
                {currentFolderId && (
                  <button
                    onClick={() => move(null)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-500 dark:text-white/40 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors border-b border-gray-100 dark:border-white/[0.05]">
                    ✕ Retirer du dossier
                  </button>
                )}
                {folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => move(f.id)}
                    className={'w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ' + (
                      f.id === currentFolderId
                        ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10'
                        : 'text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                    )}>
                    <span>📁</span> {f.name}
                    {f.id === currentFolderId && <span className="ml-auto text-xs">✓</span>}
                  </button>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
