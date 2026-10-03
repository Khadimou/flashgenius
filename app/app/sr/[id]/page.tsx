'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { QUALITY_LABELS } from '@/lib/sm2'

interface Card { id: string; question: string; answer: string; category?: string | null; easeFactor: number; dueDate: string }

const QUALITY_COLORS = [
  'border-red-300 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20',
  'border-orange-300 dark:border-orange-800/50 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20',
  'border-amber-300 dark:border-amber-800/50 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20',
  'border-sky-300 dark:border-sky-800/50 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/20',
  'border-violet-300 dark:border-violet-800/50 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/20',
  'border-emerald-300 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20',
]

const QUALITY_HINTS = [
  'Aucun souvenir, a reapprendre',
  'Erreur, mais ca revient vaguement',
  'Erreur, mais la reponse semble facile apres',
  'Correct, mais avec difficulte',
  'Correct, avec une petite hesitation',
  'Reponse parfaite et immediate',
]

export default function SRSessionPage() {
  const { id } = useParams<{ id: string }>()
  const [allCards, setAllCards] = useState<Card[]>([])
  const [queue, setQueue] = useState<Card[]>([])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deckName, setDeckName] = useState('')
  const [force, setForce] = useState(false)
  const [hoveredQ, setHoveredQ] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/decks/' + id)
      .then((r) => r.json())
      .then((d) => {
        const cards: Card[] = d.deck?.cards ?? []
        setAllCards(cards)
        setDeckName(d.deck?.name ?? '')
        const now = new Date()
        const due = cards
          .filter((c) => new Date(c.dueDate) <= now)
          .sort((a, b) => a.easeFactor - b.easeFactor)
        setQueue(due)
        setLoading(false)
      })
  }, [id])

  function startForce() {
    const sorted = [...allCards].sort((a, b) => a.easeFactor - b.easeFactor)
    setQueue(sorted)
    setForce(true)
    setIdx(0); setFlipped(false); setDone(false)
  }

  async function rate(quality: 0|1|2|3|4|5) {
    const card = queue[idx]
    if (!card) return
    await fetch('/api/sr/' + card.id, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quality }),
    })
    if (idx + 1 >= queue.length) setDone(true)
    else { setIdx((i) => i + 1); setFlipped(false); setHoveredQ(null) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full" /></div>

  if (queue.length === 0 && !force) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tout a jour !</h2>
      <p className="text-gray-500 dark:text-white/40 mb-8">Aucune carte a reviser pour <strong>{deckName}</strong> aujourd&apos;hui.</p>
      <div className="flex gap-3 justify-center">
        <button onClick={startForce}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-white/60 border border-gray-200 dark:border-white/10 hover:border-violet-400 transition-all">
          Forcer la revision ({allCards.length} cartes)
        </button>
        <Link href={'/app/deck/' + id}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors">
          Retour au deck
        </Link>
      </div>
    </div>
  )

  if (done) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-5">🧠</div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Session SR terminee !</h2>
      <p className="text-gray-500 dark:text-white/40 mb-8">{queue.length} carte{queue.length > 1 ? 's' : ''} revisee{queue.length > 1 ? 's' : ''}</p>
      <Link href={'/app/deck/' + id}
        className="px-6 py-3 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors">
        Retour au deck →
      </Link>
    </div>
  )

  const card = queue[idx]

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link href={'/app/deck/' + id} className="text-sm text-gray-400 dark:text-white/30 hover:text-violet-500 transition-colors">← {deckName}</Link>
        <div className="text-sm text-gray-400 dark:text-white/30">
          <span className="text-violet-500 font-semibold">{idx + 1}</span> / {queue.length}
          {force && <span className="ml-2 text-xs">(revision forcee)</span>}
        </div>
      </div>

      <div className="h-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-full mb-8 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
          style={{ width: (idx / queue.length * 100) + '%' }} />
      </div>

      {/* Card with proper 3D flip */}
      <div className="cursor-pointer select-none mb-8"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped((f) => !f)}>
        <div
          className="relative rounded-3xl border-2 border-gray-200 dark:border-white/[0.08]"
          style={{ transformStyle: 'preserve-3d', transition: 'transform 0.45s ease', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', minHeight: '240px' }}
        >
          {/* Invisible sizer */}
          <div className="p-8 flex flex-col items-center gap-4 invisible" aria-hidden="true">
            <p className="text-xl font-semibold leading-relaxed">{card.question}</p>
            <p className="text-sm">Cliquer pour voir la reponse</p>
          </div>

          {/* Front */}
          <div
            className="absolute inset-0 rounded-3xl bg-white dark:bg-[#0a0a14] p-8 flex flex-col items-center justify-center gap-4 overflow-auto"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {card.category && <span className="text-xs font-semibold text-violet-400 uppercase tracking-widest">{card.category}</span>}
            <p className="text-xl font-semibold text-gray-900 dark:text-white leading-relaxed text-center">{card.question}</p>
            <p className="text-sm text-gray-400 dark:text-white/25">Cliquer pour voir la reponse</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-3xl bg-white dark:bg-[#0a0a14] p-8 flex flex-col items-center justify-center gap-4 overflow-auto"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Reponse</span>
            <p className="text-lg text-gray-700 dark:text-white/85 leading-relaxed text-center">{card.answer}</p>
          </div>
        </div>
      </div>

      {/* SM-2 rating */}
      {flipped && (
        <div>
          <p className="text-center text-xs text-gray-400 dark:text-white/30 mb-3">Comment tu t&apos;en es sorti ?</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {([0,1,2,3,4,5] as const).map((q) => (
              <button key={q} onClick={() => rate(q)}
                onMouseEnter={() => setHoveredQ(q)}
                onMouseLeave={() => setHoveredQ(null)}
                className={'py-3 rounded-xl text-xs font-medium border-2 transition-all ' + QUALITY_COLORS[q]}>
                {QUALITY_LABELS[q]}
              </button>
            ))}
          </div>
          {/* Hint for hovered button */}
          <div className="h-6 mt-2 flex items-center justify-center">
            {hoveredQ !== null && (
              <p className="text-xs text-gray-400 dark:text-white/30 animate-fade-in">{QUALITY_HINTS[hoveredQ]}</p>
            )}
          </div>
          {/* Compact legend */}
          <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-gray-400 dark:text-white/25">
            <span>0-2 = erreur → carte reinitialises</span>
            <span className="w-px h-3 bg-gray-300 dark:bg-white/10" />
            <span>3-5 = correct → intervalle augmente</span>
          </div>
        </div>
      )}
    </div>
  )
}
