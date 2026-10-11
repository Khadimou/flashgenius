'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Brouillon',
  REVISION: 'En revision',
  EXAM: 'Mode examen',
}
const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-white/30',
  REVISION: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  EXAM: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
}

interface TeacherDeck {
  id: string
  name: string
  shareStatus: 'DRAFT' | 'REVISION' | 'EXAM'
  _count: { cards: number; enrollments: number }
}

interface StudentEnrollment {
  id: string
  enrolledAt: string
  deck: {
    id: string
    name: string
    shareStatus: 'DRAFT' | 'REVISION' | 'EXAM'
    _count: { cards: number }
    user: { name: string | null; email: string | null; subject: string | null; slug: string | null }
  }
}

export default function CoursesPage() {
  const [role, setRole] = useState<'TEACHER' | 'STUDENT' | null>(null)
  const [teacherDecks, setTeacherDecks] = useState<TeacherDeck[]>([])
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [becomingTeacher, setBecomingTeacher] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/courses')
    const data = await res.json()
    setRole(data.role)
    if (data.role === 'TEACHER') setTeacherDecks(data.decks ?? [])
    else setEnrollments(data.enrollments ?? [])
    setLoading(false)
  }

  async function becomeTeacher() {
    setBecomingTeacher(true)
    const res = await fetch('/api/account/role', { method: 'POST' })
    if (res.ok) await load()
    setBecomingTeacher(false)
  }

  async function toggleStatus(deckId: string, current: string) {
    setTogglingId(deckId)
    const next = current === 'DRAFT' ? 'REVISION' : current === 'REVISION' ? 'EXAM' : 'DRAFT'
    const res = await fetch(`/api/decks/${deckId}/share`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    if (res.ok) {
      setTeacherDecks((ds) => ds.map((d) => d.id === deckId ? { ...d, shareStatus: next as TeacherDeck['shareStatus'] } : d))
    }
    setTogglingId(null)
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full" />
    </div>
  )

  // ── STUDENT VIEW ──────────────────────────────────────────────────
  if (role === 'STUDENT') return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">&#127891; Mes cours</h1>
          <p className="text-gray-500 dark:text-white/40 mt-1 text-sm">Cours auxquels tu es inscrit.</p>
        </div>
        <button onClick={becomeTeacher} disabled={becomingTeacher}
          className="px-4 py-2 rounded-xl text-sm font-medium border border-violet-300 dark:border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all disabled:opacity-50">
          {becomingTeacher ? 'Activation...' : '&#127979; Devenir enseignant'}
        </button>
      </div>

      {enrollments.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-white/25">
          <div className="text-4xl mb-3">&#128218;</div>
          <p className="text-sm">Aucun cours rejoint pour l&apos;instant.</p>
          <p className="text-xs mt-1">Demande un lien d&apos;invitation a ton professeur.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {enrollments.map((e) => {
            const locked = e.deck.shareStatus === 'EXAM'
            const teacherName = e.deck.user.name ?? e.deck.user.email?.split('@')[0] ?? 'Enseignant'
            return (
              <div key={e.id} className={"rounded-2xl border p-5 " + (locked
                ? 'bg-amber-50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-500/20'
                : 'bg-white dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.07]')}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h2 className="font-semibold text-gray-900 dark:text-white text-sm">{e.deck.name}</h2>
                  <span className={"px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 " + STATUS_COLOR[e.deck.shareStatus]}>
                    {STATUS_LABEL[e.deck.shareStatus]}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-white/30 mb-1">
                  Prof : {teacherName}
                  {e.deck.user.subject && <span className="ml-1">— {e.deck.user.subject}</span>}
                </p>
                <p className="text-xs text-gray-400 dark:text-white/30 mb-4">{e.deck._count.cards} cartes</p>

                {locked ? (
                  <div className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
                    &#128274; Revisions masquees par votre professeur jusqu&apos;a l&apos;examen
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Link href={`/app/review/${e.deck.id}?enrolled=1`}
                      className="flex-1 py-2 rounded-xl text-xs font-medium text-center bg-violet-600 text-white hover:bg-violet-500 transition-colors">
                      Reviser
                    </Link>
                    <Link href={`/app/sr/${e.deck.id}?enrolled=1`}
                      className="flex-1 py-2 rounded-xl text-xs font-medium text-center border border-violet-300 dark:border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors">
                      SR
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  // ── TEACHER VIEW ──────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">&#127979; Mes cours partages</h1>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300">ENSEIGNANT</span>
        </div>
        <p className="text-gray-500 dark:text-white/40 text-sm">
          Partage tes decks avec tes eleves. Va sur un deck puis clique sur "Partager" pour l&apos;ajouter ici.
        </p>
      </div>

      {teacherDecks.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-white/25">
          <div className="text-4xl mb-3">&#128218;</div>
          <p className="text-sm mb-2">Aucun cours partage pour l&apos;instant.</p>
          <Link href="/app/library" className="text-violet-500 hover:underline text-xs">
            Aller dans ma bibliotheque pour partager un deck &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {teacherDecks.map((deck) => {
            const inviteLink = `${baseUrl}/join/${deck.id}`
            return (
              <div key={deck.id} className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] rounded-2xl p-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-semibold text-gray-900 dark:text-white truncate">{deck.name}</h2>
                      <span className={"px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 " + STATUS_COLOR[deck.shareStatus]}>
                        {STATUS_LABEL[deck.shareStatus]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-white/30">
                      {deck._count.cards} cartes &middot; {deck._count.enrollments} eleve{deck._count.enrollments > 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status cycle button */}
                    <button
                      onClick={() => toggleStatus(deck.id, deck.shareStatus)}
                      disabled={togglingId === deck.id}
                      title="Changer le statut"
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/50 hover:border-violet-400 dark:hover:border-violet-500/40 hover:text-violet-600 dark:hover:text-violet-400 transition-all disabled:opacity-50">
                      {togglingId === deck.id ? '...' : (
                        deck.shareStatus === 'DRAFT' ? '&#127968; Publier' :
                        deck.shareStatus === 'REVISION' ? '&#128274; Mode examen' :
                        '&#128196; Reprendre la revision'
                      )}
                    </button>

                    {/* Invite link */}
                    {deck.shareStatus === 'REVISION' && (
                      <button
                        onClick={() => { navigator.clipboard.writeText(inviteLink); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 text-white hover:bg-violet-500 transition-colors"
                        title={inviteLink}>
                        &#128279; Copier le lien
                      </button>
                    )}

                    <Link href={`/app/deck/${deck.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white border border-gray-100 dark:border-white/5 transition-colors">
                      Voir
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
