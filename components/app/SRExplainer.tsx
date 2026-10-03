'use client'

import { useState } from 'react'

export default function SRExplainer() {
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-8 rounded-2xl border border-violet-200 dark:border-violet-500/20 bg-violet-50/50 dark:bg-violet-950/20 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">💡</span>
          <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
            Comment fonctionne la revision espacee ?
          </span>
        </div>
        <svg
          className={'w-4 h-4 text-violet-400 transition-transform duration-200 ' + (open ? 'rotate-180' : '')}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 text-sm text-gray-600 dark:text-white/60 leading-relaxed">
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white/80 mb-1">Le principe</h3>
            <p>
              La <strong>revision espacee</strong> (spaced repetition) est une technique scientifiquement prouvee
              pour memoriser sur le long terme. Au lieu de tout reviser d&apos;un coup, tu revois chaque carte
              a des intervalles croissants : plus tu connais une carte, plus l&apos;intervalle s&apos;allonge.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white/80 mb-1">L&apos;algorithme SM-2</h3>
            <p>
              FlashGenius utilise <strong>SM-2</strong> (SuperMemo 2), l&apos;algorithme de reference pour les flashcards.
              A chaque revision, tu notes ta maitrise de 0 a 5. L&apos;algorithme calcule alors :
            </p>
            <ul className="mt-2 space-y-1.5 ml-4">
              <li className="flex items-start gap-2">
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5" />
                <span><strong>Le prochain intervalle</strong> — quand tu reverras cette carte (1 jour, 3 jours, 1 semaine, 1 mois...)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5" />
                <span><strong>Le facteur de facilite</strong> — les cartes difficiles reviennent plus souvent, les faciles s&apos;espacent vite</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5" />
                <span><strong>La reinitialisation</strong> — une note &lt; 3 remet la carte au debut (intervalle = 1 jour)</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white/80 mb-1">Les 6 niveaux de notation</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30">
                <span className="font-bold text-red-500 text-xs">0</span>
                <span className="text-xs">Aucun souvenir</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/30">
                <span className="font-bold text-orange-500 text-xs">1</span>
                <span className="text-xs">Erreur, mais ca revient</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30">
                <span className="font-bold text-amber-500 text-xs">2</span>
                <span className="text-xs">Erreur, facile apres</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/30">
                <span className="font-bold text-sky-500 text-xs">3</span>
                <span className="text-xs">Correct, difficile</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/30">
                <span className="font-bold text-violet-500 text-xs">4</span>
                <span className="text-xs">Correct, hesitation</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30">
                <span className="font-bold text-emerald-500 text-xs">5</span>
                <span className="text-xs">Parfait !</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 dark:text-white/30 pt-1">
            Astuce : revise chaque jour les cartes dues pour un effet optimal. Meme 5 minutes suffisent.
          </p>
        </div>
      )}
    </div>
  )
}
