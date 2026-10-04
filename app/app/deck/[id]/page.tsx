'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import FlashCard from '@/components/app/FlashCard'
import CardEditor, { CardDraft } from '@/components/app/CardEditor'
import DeckFolderPicker from '@/components/app/DeckFolderPicker'

interface Card extends CardDraft { id: string; position: number; dueDate: string }
interface Deck { id: string; name: string; cards: Card[]; folder?: { id: string; name: string } | null }
interface Folder { id: string; name: string }

function uniqueCategories(cards: Card[]) {
  return Array.from(new Set(cards.map((c) => c.category).filter(Boolean)))
}

export default function DeckPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [deck, setDeck] = useState<Deck | null>(null)
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [renamingDeck, setRenamingDeck] = useState(false)
  const [deckNameDraft, setDeckNameDraft] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/decks/' + id).then((r) => r.json()),
      fetch('/api/folders').then((r) => r.json()),
    ]).then(([d, f]) => {
      setDeck(d.deck)
      setFolders(f.folders ?? [])
      setLoading(false)
    })
  }, [id])

  const categories = deck ? uniqueCategories(deck.cards) : []

  async function updateCard(cardId: string, updated: CardDraft) {
    const res = await fetch('/api/cards/' + cardId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    const data = await res.json()
    if (res.ok) {
      setDeck((d) => d ? { ...d, cards: d.cards.map((c) => c.id === cardId ? { ...c, ...data.card } : c) } : d)
    }
    setEditingId(null)
    setAdding(false)
  }

  async function addCard(draft: CardDraft) {
    const res = await fetch('/api/decks/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    // Create card via POST to a virtual route — simpler: reload after add
    const cardRes = await fetch('/api/decks/' + id + '/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...draft, position: deck?.cards.length ?? 0 }),
    })
    if (cardRes.ok) {
      const fresh = await fetch('/api/decks/' + id).then((r) => r.json())
      setDeck(fresh.deck)
    }
    setAdding(false)
  }

  async function deleteCard(cardId: string) {
    await fetch('/api/cards/' + cardId, { method: 'DELETE' })
    setDeck((d) => d ? { ...d, cards: d.cards.filter((c) => c.id !== cardId) } : d)
  }

  async function deleteDeck() {
    if (!confirm('Supprimer ce deck ? Cette action est irreversible.')) return
    setDeleting(true)
    await fetch('/api/decks/' + id, { method: 'DELETE' })
    router.push('/app/library')
  }

  async function renameDeck() {
    const name = deckNameDraft.trim()
    if (!name || name === deck?.name) { setRenamingDeck(false); return }
    const res = await fetch('/api/decks/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      setDeck((d) => d ? { ...d, name } : d)
    }
    setRenamingDeck(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full" />
    </div>
  )

  if (!deck) return (
    <div className="text-center py-24 text-gray-500 dark:text-white/40">
      Deck introuvable. <Link href="/app/library" className="text-violet-500 underline">Retour</Link>
    </div>
  )

  const now = new Date()
  const dueCards = deck.cards.filter((c) => new Date(c.dueDate) <= now)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-white/30 mb-3">
          <Link href="/app/library" className="hover:text-violet-500 transition-colors">Bibliotheque</Link>
          <span>/</span>
          <span className="text-gray-600 dark:text-white/60">{deck.name}</span>
        </div>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            {renamingDeck ? (
              <input
                autoFocus
                value={deckNameDraft}
                onChange={(e) => setDeckNameDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") renameDeck(); if (e.key === "Escape") setRenamingDeck(false) }}
                onBlur={renameDeck}
                className="text-2xl font-bold bg-transparent border-b-2 border-violet-500 text-gray-900 dark:text-white outline-none w-full max-w-sm"
              />
            ) : (
              <h1
                className="text-2xl font-bold text-gray-900 dark:text-white cursor-pointer hover:text-violet-600 dark:hover:text-violet-400 transition-colors group/title flex items-center gap-2"
                onClick={() => { setDeckNameDraft(deck.name); setRenamingDeck(true) }}
                title="Cliquer pour renommer">
                {deck.name}
                <span className="text-sm font-normal text-gray-300 dark:text-white/20 opacity-0 group-hover/title:opacity-100 transition-opacity">✏️</span>
              </h1>
            )}
            <p className="text-gray-400 dark:text-white/30 text-sm mt-1">
              {deck.cards.length} carte{deck.cards.length > 1 ? 's' : ''}
              {dueCards.length > 0 && <span className="ml-2 text-amber-500">· {dueCards.length} a reviser</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DeckFolderPicker deckId={id} currentFolderId={deck.folder?.id} folders={folders} />
            <Link href={'/app/review/' + id}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-white/70 border border-gray-200 dark:border-white/10 hover:border-violet-400 dark:hover:border-violet-500/40 transition-all bg-white dark:bg-transparent">
              ▶ Reviser
            </Link>
            <Link href={'/app/sr/' + id}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all flex items-center gap-1">
              🧠 SR {dueCards.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">{dueCards.length}</span>}
            </Link>
            <a href={'/api/export/deck/' + id}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 dark:text-white/40 border border-gray-200 dark:border-white/10 hover:text-gray-700 dark:hover:text-white transition-colors">
              ↓ CSV
            </a>
            <a href={'/api/export/deck/' + id + '/pdf'}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 dark:text-white/40 border border-gray-200 dark:border-white/10 hover:text-gray-700 dark:hover:text-white transition-colors">
              ↓ PDF
            </a>
            <button onClick={deleteDeck} disabled={deleting}
              className="px-4 py-2 rounded-xl text-sm text-red-400 hover:text-red-500 border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all">
              🗑 Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat, i) => (
            <span key={cat} className={'px-3 py-1 rounded-full text-xs font-medium ' +
              ['bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
               'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
               'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
               'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
               'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'][i % 5]}>
              {cat} ({deck.cards.filter((c) => c.category === cat).length})
            </span>
          ))}
        </div>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {deck.cards.map((card) =>
          editingId === card.id ? (
            <CardEditor key={card.id} card={card} categories={categories}
              onSave={(u) => updateCard(card.id, u)} onCancel={() => setEditingId(null)} />
          ) : (
            <FlashCard key={card.id} card={card} categories={categories} showActions
              onEdit={() => setEditingId(card.id)} onDelete={() => deleteCard(card.id)} />
          )
        )}

        {adding ? (
          <CardEditor
            card={{ question:'', answer:'', category: categories[0] ?? 'General' }}
            categories={categories}
            onSave={addCard}
            onCancel={() => setAdding(false)} />
        ) : (
          <button onClick={() => setAdding(true)}
            className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/[0.07] hover:border-violet-300 dark:hover:border-violet-500/30 text-gray-400 dark:text-white/25 hover:text-violet-500 dark:hover:text-violet-400 transition-all flex items-center justify-center gap-2 text-sm font-medium min-h-[140px]">
            + Ajouter une carte
          </button>
        )}
      </div>
    </div>
  )
}
