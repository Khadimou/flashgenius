'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Folder { id: string; name: string; _count?: { decks: number } }

interface Props {
  folders: Folder[]
}

export default function FolderManager({ folders }: Props) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function create() {
    if (!name.trim()) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    setLoading(false)
    if (res.ok) {
      setName('')
      setCreating(false)
      router.refresh()
    } else {
      const d = await res.json()
      setError(d.error ?? 'Erreur')
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {creating ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') create(); if (e.key === 'Escape') setCreating(false) }}
            placeholder="Nom du dossier..."
            className="px-3 py-1.5 rounded-lg border border-violet-300 dark:border-violet-500/40 bg-white dark:bg-white/[0.05] text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/25 outline-none focus:ring-2 focus:ring-violet-500/30 w-44"
          />
          <button
            onClick={create} disabled={loading || !name.trim()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40 transition-colors">
            {loading ? '...' : 'Créer'}
          </button>
          <button
            onClick={() => { setCreating(false); setName(''); setError('') }}
            className="px-3 py-1.5 rounded-lg text-xs text-gray-500 dark:text-white/40 border border-gray-200 dark:border-white/10 hover:border-gray-300 transition-colors">
            Annuler
          </button>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-white/40 border border-dashed border-gray-300 dark:border-white/10 hover:border-violet-400 dark:hover:border-violet-500/40 hover:text-violet-600 dark:hover:text-violet-400 transition-all">
          <span className="text-base leading-none">+</span> Nouveau dossier
        </button>
      )}
    </div>
  )
}
