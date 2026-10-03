'use client'

import { useState } from 'react'

const CATEGORY_STYLES = [
  { border: 'border-violet-500/40', badge: 'bg-violet-500/20 text-violet-400', face: 'bg-violet-50 dark:bg-violet-950/60' },
  { border: 'border-indigo-500/40', badge: 'bg-indigo-500/20 text-indigo-400', face: 'bg-indigo-50 dark:bg-indigo-950/60' },
  { border: 'border-sky-500/40', badge: 'bg-sky-500/20 text-sky-400', face: 'bg-sky-50 dark:bg-sky-950/60' },
  { border: 'border-emerald-500/40', badge: 'bg-emerald-500/20 text-emerald-400', face: 'bg-emerald-50 dark:bg-emerald-950/60' },
  { border: 'border-amber-500/40', badge: 'bg-amber-500/20 text-amber-400', face: 'bg-amber-50 dark:bg-amber-950/60' },
]

function getCategoryIndex(category: string, categories: string[]) {
  const idx = categories.indexOf(category)
  return idx >= 0 ? idx % CATEGORY_STYLES.length : 0
}

interface Card { id?: string; question: string; answer: string; category?: string | null }

interface Props {
  card: Card
  categories: string[]
  onEdit?: () => void
  onDelete?: () => void
  showActions?: boolean
}

export default function FlashCard({ card, categories, onEdit, onDelete, showActions }: Props) {
  const [flipped, setFlipped] = useState(false)
  const ci = getCategoryIndex(card.category ?? '', categories)
  const style = CATEGORY_STYLES[ci]

  const faceBase = 'absolute inset-0 rounded-2xl p-5 flex flex-col gap-3 overflow-auto'

  return (
    <div className="relative group">
      <div
        className="cursor-pointer select-none"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className={'relative rounded-2xl border-2 ' + style.border}
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.45s ease',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '160px',
          }}
        >
          {/* Invisible sizer so the container has natural height */}
          <div className="p-5 flex flex-col gap-3 invisible" aria-hidden="true">
            {card.category && (
              <span className="text-xs font-semibold px-2 py-0.5">{card.category}</span>
            )}
            <p className="text-sm font-semibold leading-snug">{card.question}</p>
            <p className="text-xs mt-auto">cliquer pour la reponse</p>
          </div>

          {/* Front face */}
          <div
            className={faceBase + ' ' + style.face}
            style={{ backfaceVisibility: 'hidden' }}
          >
            {card.category && (
              <span className={'text-xs font-semibold px-2 py-0.5 rounded-full self-start ' + style.badge}>
                {card.category}
              </span>
            )}
            <p className="text-sm font-semibold text-gray-800 dark:text-white leading-snug">{card.question}</p>
            <p className="text-xs text-gray-400 dark:text-white/25 mt-auto">cliquer pour la reponse</p>
          </div>

          {/* Back face */}
          <div
            className={faceBase + ' bg-white dark:bg-[#0f0f1a]'}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className="text-xs font-semibold text-gray-400 dark:text-white/40 uppercase tracking-widest">Reponse</span>
            <p className="text-sm text-gray-700 dark:text-white/85 leading-relaxed">{card.answer}</p>
          </div>
        </div>
      </div>

      {showActions && (onEdit || onDelete) && (
        <div className="absolute top-2 right-2 hidden group-hover:flex gap-1 z-10">
          {onEdit && (
            <button onClick={(e) => { e.stopPropagation(); onEdit() }}
              className="w-7 h-7 rounded-lg bg-black/40 dark:bg-black/60 backdrop-blur-sm text-white/70 hover:text-white text-xs flex items-center justify-center transition-colors">
              ✏️
            </button>
          )}
          {onDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="w-7 h-7 rounded-lg bg-black/40 dark:bg-black/60 backdrop-blur-sm text-red-400 hover:text-red-300 text-xs flex items-center justify-center transition-colors">
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  )
}
