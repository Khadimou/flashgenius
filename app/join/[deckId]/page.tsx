'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface DeckInfo {
  id: string
  name: string
  _count: { cards: number }
  user: { name: string | null; email: string | null; subject: string | null; slug: string | null }
}

export default function JoinPage() {
  const { deckId } = useParams<{ deckId: string }>()
  const { data: session, status } = useSession()
  const router = useRouter()
  const [deck, setDeck] = useState<DeckInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/join/${deckId}`)
      .then((r) => r.json())
      .then((d) => { setDeck(d.deck ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [deckId])

  async function join() {
    if (joining) return
    setJoining(true)
    setError('')
    const res = await fetch(`/api/join/${deckId}`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setJoined(true)
      setTimeout(() => router.push('/app/courses'), 1500)
    } else {
      setError(data.error ?? 'Erreur')
      setJoining(false)
    }
  }

  const teacherName = deck?.user.name ?? deck?.user.email?.split('@')[0] ?? 'Enseignant'

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050510]">
      <div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full" />
    </div>
  )

  if (!deck) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050510] px-4">
      <div className="text-center">
        <div className="text-4xl mb-4">&#128579;</div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Cours introuvable</h1>
        <p className="text-gray-500 dark:text-white/40 text-sm mb-6">
          Ce cours n&apos;existe pas ou n&apos;est plus disponible.
        </p>
        <Link href="/" className="text-violet-500 hover:underline text-sm">Retour a l&apos;accueil</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050510] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-sm font-black text-white">F</div>
          <span className="font-bold text-gray-900 dark:text-white text-lg">FlashGenius</span>
        </div>

        <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] rounded-2xl p-8 shadow-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-2xl mx-auto mb-5">
            &#127891;
          </div>

          <p className="text-xs font-medium text-violet-500 uppercase tracking-wide mb-1">Invitation au cours</p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{deck.name}</h1>
          <p className="text-sm text-gray-500 dark:text-white/40 mb-1">
            par <span className="font-medium text-gray-700 dark:text-white/70">{teacherName}</span>
            {deck.user.subject && <span className="ml-1 text-gray-400 dark:text-white/30">— {deck.user.subject}</span>}
          </p>
          <p className="text-xs text-gray-400 dark:text-white/30 mb-8">
            {deck._count.cards} flashcard{deck._count.cards > 1 ? 's' : ''}
          </p>

          {joined ? (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400 text-sm">
              &#10003; Inscrit ! Redirection vers tes cours...
            </div>
          ) : status === 'unauthenticated' ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-white/40">Connecte-toi pour rejoindre ce cours.</p>
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(`/join/${deckId}`)}`}
                className="block w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all">
                Se connecter
              </Link>
            </div>
          ) : status === 'loading' ? (
            <div className="flex justify-center">
              <div className="animate-spin w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="space-y-3">
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button onClick={join} disabled={joining}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 transition-all">
                {joining ? 'Inscription...' : 'Rejoindre ce cours'}
              </button>
              <Link href="/app" className="block text-xs text-gray-400 hover:text-gray-600 dark:hover:text-white/60 transition-colors">
                Retour a l&apos;application
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
