"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface TeacherQuiz {
  id: string; title: string; published: boolean; deckName: string | null
  questionCount: number; attemptCount: number; avgPercent: number | null
}
interface StudentQuiz {
  id: string; title: string; teacher: string | null; deckName: string | null
  questionCount: number; attemptCount: number; lastScore: { score: number; total: number } | null
}

export default function QuizzesPage() {
  const [role, setRole] = useState<"TEACHER" | "STUDENT" | null>(null)
  const [tQuizzes, setTQuizzes] = useState<TeacherQuiz[]>([])
  const [sQuizzes, setSQuizzes] = useState<StudentQuiz[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/quizzes").then((r) => r.json()).then((d) => {
      setRole(d.role)
      if (d.role === "TEACHER") setTQuizzes(d.quizzes ?? [])
      else setSQuizzes(d.quizzes ?? [])
      setLoading(false)
    })
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">&#128221; QCM</h1>
          <p className="text-gray-500 dark:text-white/40 mt-1 text-sm">
            {role === "TEACHER" ? "Cree des QCM pour tes eleves et suis leurs resultats." : "Les QCM publies dans tes cours."}
          </p>
        </div>
        {role === "TEACHER" && (
          <Link href="/app/quizzes/new"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shrink-0">
            + Nouveau QCM
          </Link>
        )}
      </div>

      {loading && <p className="text-sm text-gray-400">Chargement...</p>}

      {!loading && role === "TEACHER" && (
        tQuizzes.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-gray-300 dark:border-white/15 text-sm text-gray-500 dark:text-white/40">
            Aucun QCM pour l&apos;instant. Colle un cours ou choisis un de tes decks et l&apos;IA genere les questions.
          </div>
        ) : (
          <div className="space-y-3">
            {tQuizzes.map((q) => (
              <Link key={q.id} href={"/app/quizzes/" + q.id}
                className="block p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] hover:border-violet-400/60 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{q.title}</h3>
                  <span className={"shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium " + (q.published
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-white/30")}>
                    {q.published ? "Publie" : "Brouillon"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-white/40 mt-1.5">
                  {q.questionCount} question{q.questionCount > 1 ? "s" : ""}
                  {q.deckName ? " · cours : " + q.deckName : ""}
                  {" · "}{q.attemptCount} tentative{q.attemptCount > 1 ? "s" : ""}
                  {q.avgPercent !== null ? " · moyenne " + q.avgPercent + "%" : ""}
                </p>
              </Link>
            ))}
          </div>
        )
      )}

      {!loading && role === "STUDENT" && (
        sQuizzes.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-gray-300 dark:border-white/15 text-sm text-gray-500 dark:text-white/40">
            Aucun QCM disponible. Ils apparaissent ici quand un enseignant en publie dans un cours auquel tu es inscrit.
          </div>
        ) : (
          <div className="space-y-3">
            {sQuizzes.map((q) => (
              <Link key={q.id} href={"/app/quizzes/" + q.id}
                className="block p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] hover:border-violet-400/60 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{q.title}</h3>
                  {q.lastScore && (
                    <span className="shrink-0 text-sm font-bold text-violet-600 dark:text-violet-400">{q.lastScore.score}/{q.lastScore.total}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-white/40 mt-1.5">
                  {q.questionCount} questions{q.teacher ? " · " + q.teacher : ""}{q.deckName ? " · " + q.deckName : ""}
                </p>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  )
}
