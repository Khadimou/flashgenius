'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Card { id: string; question: string; answer: string; category?: string | null }

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>()
  const [cards, setCards] = useState<Card[]>([])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [mastered, setMastered] = useState<string[]>([])
  const [toReview, setToReview] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deckName, setDeckName] = useState('')

  useEffect(() => {
    fetch('/api/decks/' + id)
      .then((r) => r.json())
      .then((d) => {
        setCards(d.deck?.cards ?? [])
        setDeckName(d.deck?.name ?? '')
        setLoading(false)
      })
  }, [id])

  const card = cards[idx]
  const progress = cards.length > 0 ? Math.round((idx / cards.length) * 100) : 0

  function answer(knew: boolean) {
    if (!card) return
    if (knew) setMastered((m) => [...m, card.id])
    else setToReview((t) => [...t, card.id])

    if (idx + 1 >= cards.length) setDone(true)
    else { setIdx((i) => i + 1); setFlipped(false) }
  }

  function restart() {
    setIdx(0); setFlipped(false); setMastered([]); setToReview([]); setDone(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full" />
    </div>
  )

  if (done) {
    const total = mastered.length + toReview.length
    const pct = total > 0 ? Math.round((mastered.length / total) * 100) : 0
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-5">{pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📖'}</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Session terminee !</h2>
        <p className="text-gray-500 dark:text-white/40 mb-8">Resultat pour <strong>{deckName}</strong></p>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07]">
            <p className="text-2xl font-bold text-violet-500">{pct}%</p>
            <p className="text-xs text-gray-400 dark:text-white/30 mt-1">Score</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07]">
            <p className="text-2xl font-bold text-emerald-500">{mastered.length}</p>
            <p className="text-xs text-gray-400 dark:text-white/30 mt-1">Maîtrisees</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07]">
            <p className="text-2xl font-bold text-amber-500">{toReview.length}</p>
            <p className="text-xs text-gray-400 dark:text-white/30 mt-1">A revoir</p>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={restart}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-white/60 border border-gray-200 dark:border-white/10 hover:border-violet-400 transition-all">
            Recommencer
          </button>
          <Link href={'/app/deck/' + id}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors">
            Retour au deck →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href={'/app/deck/' + id} className="text-sm text-gray-400 dark:text-white/30 hover:text-violet-500 transition-colors">← {deckName}</Link>
        <span className="text-sm text-gray-400 dark:text-white/30">{idx + 1} / {cards.length}</span>
      </div>

      {/* Progress */}
      <div className="h-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-full mb-8 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: progress + '%' }} />
      </div>

      {/* Card */}
      {card && (
        <div className="mb-8">
          <div
            className="cursor-pointer select-none"
            style={{ perspective: '1000px' }}
            onClick={() => setFlipped((f) => !f)}
          >
            <div
              className="relative rounded-3xl bg-white dark:bg-white/[0.03] border-2 border-gray-200 dark:border-white/[0.08] min-h-[240px] flex flex-col items-center justify-center p-8 text-center"
              style={{
                transformStyle: 'preserve-3d',
                transition: 'transform 0.45s ease',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Front */}
              <div style={{ backfaceVisibility: 'hidden' }} className="flex flex-col items-center gap-4">
                {card.category && (
                  <span className="text-xs font-semibold text-violet-400 uppercase tracking-widest">{card.category}</span>
                )}
                <p className="text-xl font-semibold text-gray-900 dark:text-white leading-relaxed">{card.question}</p>
                <p className="text-sm text-gray-400 dark:text-white/25">Cliquer pour voir la reponse</p>
              </div>
              {/* Back */}
              <div className="absolute inset-0 p-8 flex flex-col items-center justify-center gap-4" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <span className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Reponse</span>
                <p className="text-lg text-gray-700 dark:text-white/85 leading-relaxed">{card.answer}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {flipped && (
        <div className="flex gap-3 justify-center">
          <button onClick={() => answer(false)}
            className="flex-1 max-w-[180px] py-4 rounded-2xl font-semibold text-red-500 border-2 border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all text-sm">
            ❌ A revoir
          </button>
          <button onClick={() => answer(true)}
            className="flex-1 max-w-[180px] py-4 rounded-2xl font-semibold text-emerald-600 border-2 border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all text-sm">
            ✅ Maîtrisee
          </button>
        </div>
      )}
    </div>
  )
}
