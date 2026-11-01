'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface T { name: string; bio: string | null; subject: string | null; slug: string; courses: number; quizzes: number }

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<T[] | null>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    fetch('/api/teachers').then((r) => r.json()).then((d) => setTeachers(d.teachers ?? []))
  }, [])

  const needle = q.trim().toLowerCase()
  const list = (teachers ?? []).filter((t) => !needle || (t.name + ' ' + (t.subject ?? '')).toLowerCase().includes(needle))

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">&#128105;&#8205;&#127979; Enseignants</h1>
        <p className="text-sm text-gray-500 dark:text-white/40 mt-1">Retrouve les enseignants, leurs cours et leurs QCM publies.</p>
      </div>

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher par nom ou matiere..."
        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50" />

      {teachers === null ? (
        <p className="text-sm text-gray-400">Chargement...</p>
      ) : list.length === 0 ? (
        <p className="p-8 text-center text-sm text-gray-500 dark:text-white/40 rounded-2xl border border-dashed border-gray-300 dark:border-white/15">
          {teachers.length === 0 ? 'Aucun enseignant n\'a encore publie de cours ou de QCM.' : 'Aucun resultat.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {list.map((t) => (
            <Link key={t.slug} href={'/teacher/' + t.slug}
              className="block p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] hover:border-violet-400 dark:hover:border-violet-500/40 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-lg font-black text-white shrink-0">
                  {t.name[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{t.name}</p>
                  {t.subject && <p className="text-xs text-violet-600 dark:text-violet-400 truncate">{t.subject}</p>}
                </div>
              </div>
              {t.bio && <p className="text-sm text-gray-500 dark:text-white/50 mt-3 line-clamp-2">{t.bio}</p>}
              <p className="text-xs text-gray-400 dark:text-white/30 mt-3">
                {t.courses} cours &middot; {t.quizzes} QCM
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
