'use client'

import { useState } from 'react'

export interface CardDraft {
  id?: string
  question: string
  answer: string
  category: string
}

interface Props {
  card: CardDraft
  categories: string[]
  onSave: (card: CardDraft) => void
  onCancel: () => void
}

export default function CardEditor({ card, categories, onSave, onCancel }: Props) {
  const [q, setQ] = useState(card.question)
  const [a, setA] = useState(card.answer)
  const [cat, setCat] = useState(card.category)
  const [newCat, setNewCat] = useState('')

  const allCats = [...new Set([...categories, ...(newCat ? [newCat] : [])])]

  return (
    <div className="rounded-2xl border-2 border-violet-500/30 bg-violet-500/5 p-5 space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-white/40 mb-1">Question</label>
        <textarea value={q} onChange={(e) => setQ(e.target.value)} rows={2}
          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-white/40 mb-1">Reponse</label>
        <textarea value={a} onChange={(e) => setA(e.target.value)} rows={2}
          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-white/40 mb-1">Categorie</label>
        <div className="flex flex-wrap gap-2">
          {allCats.map((c) => (
            <button key={c} type="button" onClick={() => setCat(c)}
              className={'px-3 py-1 rounded-full text-xs font-medium transition-all border ' + (
                cat === c
                  ? 'bg-violet-600 border-violet-400 text-white'
                  : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/50 hover:border-violet-400'
              )}>
              {c}
            </button>
          ))}
          <input value={newCat} onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && newCat) { setCat(newCat); setNewCat('') } }}
            placeholder="+ nouvelle..." maxLength={30}
            className="px-3 py-1 rounded-full text-xs bg-white dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/20 text-gray-600 dark:text-white/50 focus:outline-none focus:border-violet-400 w-28" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel}
          className="px-4 py-2 rounded-xl text-sm text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white transition-colors">
          Annuler
        </button>
        <button onClick={() => q.trim() && a.trim() && onSave({ ...card, question: q.trim(), answer: a.trim(), category: cat })}
          disabled={!q.trim() || !a.trim()}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40 transition-colors">
          Sauvegarder
        </button>
      </div>
    </div>
  )
}
