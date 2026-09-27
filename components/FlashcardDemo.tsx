'use client'

import { useState } from 'react'

const CARDS = [
  { q: "Qu'est-ce que la photosynthese ?", a: "Processus par lequel les plantes convertissent la lumiere solaire en energie chimique (glucose)." },
  { q: "Quelle est la formule chimique de l'eau ?", a: "H2O - 2 atomes d'hydrogene lies a 1 atome d'oxygene." },
  { q: "Definition : l'offre et la demande", a: "Mecanisme economique qui fixe le prix d'un bien selon la quantite disponible et le desir des acheteurs." },
]

export default function FlashcardDemo() {
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const card = CARDS[idx]

  function next() {
    setFlipped(false)
    setTimeout(() => setIdx((i) => (i + 1) % CARDS.length), 180)
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div
        className="relative w-full max-w-sm h-44 cursor-pointer select-none"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className="relative w-full h-full"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.5s ease',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          <div
            className="absolute inset-0 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-6 flex flex-col items-center justify-center text-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="text-xs font-bold text-violet-400 tracking-widest uppercase mb-3">Question</span>
            <p className="text-white font-semibold text-base leading-snug">{card.q}</p>
            <p className="text-white/25 text-xs mt-4">cliquer pour reveler</p>
          </div>
          <div
            className="absolute inset-0 rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-900/30 to-indigo-900/20 p-6 flex flex-col items-center justify-center text-center"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className="text-xs font-bold text-violet-400 tracking-widest uppercase mb-3">Reponse</span>
            <p className="text-white text-sm leading-relaxed">{card.a}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={next} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-sm transition-colors">
          Suivante →
        </button>
        <span className="text-white/25 text-xs">{idx + 1} / {CARDS.length}</span>
      </div>
      <p className="text-white/25 text-xs">Generees par l'IA depuis 3 lignes de cours</p>
    </div>
  )
}
