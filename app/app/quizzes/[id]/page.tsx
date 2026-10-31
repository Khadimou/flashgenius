"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import QuizEditor, { QuizQ, validateQuestions, cleanQuestions } from "@/components/app/QuizEditor"

interface OwnerQuestion extends QuizQ { id: string }
interface OwnerData {
  isOwner: true
  quiz: { id: string; title: string; published: boolean; deck: { id: string; name: string } | null; questions: OwnerQuestion[] }
  attempts: { id: string; score: number; total: number; createdAt: string; student: string }[]
  perQuestion: { questionId: string; percentCorrect: number | null }[]
}
interface StudentData {
  isOwner: false
  quiz: { id: string; title: string; teacher: string | null; deckName: string | null; questions: { id: string; question: string; options: string[] }[] }
  myAttempts: { score: number; total: number; createdAt: string }[]
}
interface Correction { questionId: string; chosen: number; correctIndex: number; isCorrect: boolean; explanation: string }
interface Result { score: number; total: number; corrections: Correction[] }

const LETTERS = "ABCDEF"

export default function QuizDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<OwnerData | StudentData | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [answers, setAnswers] = useState<number[]>([])
  const [result, setResult] = useState<Result | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [tab, setTab] = useState<"questions" | "results" | "preview">("questions")
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<QuizQ[]>([])
  const [draftTitle, setDraftTitle] = useState("")
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  async function load() {
    const res = await fetch("/api/quizzes/" + id)
    if (!res.ok) { setNotFound(true); return }
    const d = await res.json()
    setData(d)
    setAnswers(new Array(d.quiz.questions.length).fill(-1))
    setResult(null)
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [id])

  async function submit() {
    if (!data) return
    if (answers.some((a) => a < 0) && !confirm("Certaines questions n'ont pas de reponse. Valider quand meme ?")) return
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/quizzes/" + id + "/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      })
      const r = await res.json()
      if (!res.ok) { setError(r.error ?? "Erreur"); return }
      setResult(r)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch {
      setError("Connexion impossible")
    } finally {
      setSubmitting(false)
    }
  }

  function retry() {
    if (!data) return
    setAnswers(new Array(data.quiz.questions.length).fill(-1))
    setResult(null)
    if (!data.isOwner) load()
  }

  async function togglePublish() {
    if (!data || !data.isOwner) return
    await fetch("/api/quizzes/" + id, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !data.quiz.published }),
    })
    load()
  }

  async function remove() {
    if (!confirm("Supprimer ce QCM et tous ses resultats ?")) return
    const res = await fetch("/api/quizzes/" + id, { method: "DELETE" })
    if (res.ok) router.push("/app/quizzes")
  }

  function startEdit() {
    if (!data || !data.isOwner) return
    setDraft(data.quiz.questions.map(({ question, options, correctIndex, explanation }) => ({ question, options: [...options], correctIndex, explanation })))
    setDraftTitle(data.quiz.title)
    setEditing(true)
    setError("")
  }

  async function saveEdit() {
    const v = validateQuestions(draft)
    if (v) { setError(v); return }
    if (!draftTitle.trim()) { setError("Titre requis"); return }
    setSaving(true)
    const res = await fetch("/api/quizzes/" + id, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: draftTitle, questions: cleanQuestions(draft) }),
    })
    setSaving(false)
    if (!res.ok) { setError((await res.json()).error ?? "Erreur"); return }
    setEditing(false)
    load()
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.origin + "/app/quizzes/" + id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  if (notFound) return <div className="max-w-xl mx-auto px-6 py-16 text-center text-gray-500">QCM introuvable. <Link href="/app/quizzes" className="text-violet-500 hover:underline">Retour</Link></div>
  if (!data) return <div className="max-w-3xl mx-auto px-6 py-10 text-sm text-gray-400">Chargement...</div>

  const takeQuiz = (questions: { id: string; question: string; options: string[] }[]) => (
    <div className="space-y-4">
      {result && (
        <div className="p-5 rounded-2xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 text-center">
          <p className="text-3xl font-black text-violet-700 dark:text-violet-300">{result.score} / {result.total}</p>
          <p className="text-sm text-violet-600/80 dark:text-violet-300/70 mt-1">{Math.round((result.score / Math.max(result.total, 1)) * 100)}% de bonnes reponses</p>
          <button onClick={retry} className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors">Recommencer</button>
        </div>
      )}
      {questions.map((q, i) => {
        const corr = result?.corrections[i]
        return (
          <div key={q.id} className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] space-y-3">
            <p className="font-medium text-gray-900 dark:text-white"><span className="text-violet-600 dark:text-violet-400 font-bold mr-2">{i + 1}.</span>{q.question}</p>
            <div className="space-y-2">
              {q.options.map((o, j) => {
                const selected = answers[i] === j
                let cls = "border-gray-200 dark:border-white/10 hover:border-violet-400"
                if (corr) {
                  if (j === corr.correctIndex) cls = "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                  else if (selected) cls = "border-red-400 bg-red-50 dark:bg-red-500/10"
                  else cls = "border-gray-200 dark:border-white/10 opacity-60"
                } else if (selected) cls = "border-violet-500 bg-violet-50 dark:bg-violet-500/10"
                return (
                  <button key={j} disabled={!!result} onClick={() => setAnswers((a) => a.map((v, k) => (k === i ? j : v)))}
                    className={"w-full text-left px-4 py-2.5 rounded-xl border text-sm text-gray-800 dark:text-white/85 transition-colors " + cls}>
                    <span className="font-bold mr-2 text-gray-400">{LETTERS[j]}</span>{o}
                  </button>
                )
              })}
            </div>
            {corr && corr.explanation && (
              <p className="text-xs text-gray-500 dark:text-white/50 pl-1">&#128161; {corr.explanation}</p>
            )}
          </div>
        )
      })}
      {!result && (
        <button onClick={submit} disabled={submitting}
          className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 transition-all">
          {submitting ? "Correction..." : "Valider mes reponses (" + answers.filter((a) => a >= 0).length + "/" + questions.length + ")"}
        </button>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )

  // ---------- Student view ----------
  if (!data.isOwner) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div>
          <Link href="/app/quizzes" className="text-xs text-gray-400 hover:text-violet-500">&larr; QCM</Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data.quiz.title}</h1>
          <p className="text-xs text-gray-500 dark:text-white/40 mt-1">
            {data.quiz.questions.length} questions{data.quiz.teacher ? " · " + data.quiz.teacher : ""}
            {data.myAttempts.length > 0 ? " · derniere note : " + data.myAttempts[0].score + "/" + data.myAttempts[0].total : ""}
          </p>
        </div>
        {takeQuiz(data.quiz.questions)}
      </div>
    )
  }

  // ---------- Teacher view ----------
  const { quiz, attempts, perQuestion } = data
  const avg = attempts.length ? Math.round((attempts.reduce((a, t) => a + t.score / Math.max(t.total, 1), 0) / attempts.length) * 100) : null

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <div>
        <Link href="/app/quizzes" className="text-xs text-gray-400 hover:text-violet-500">&larr; Mes QCM</Link>
        <div className="flex items-start justify-between gap-3 mt-1 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{quiz.title}</h1>
            <p className="text-xs text-gray-500 dark:text-white/40 mt-1">
              {quiz.questions.length} questions{quiz.deck ? " · cours : " + quiz.deck.name : " · aucun cours associe (acces par lien)"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={togglePublish}
              className={"px-4 py-2 rounded-xl text-sm font-semibold transition-colors " + (quiz.published
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-200"
                : "bg-violet-600 text-white hover:bg-violet-500")}>
              {quiz.published ? "Publie : depublier" : "Publier"}
            </button>
            {quiz.published && (
              <button onClick={copyLink} className="px-3 py-2 rounded-xl text-sm border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:border-violet-400">
                {copied ? "Copie !" : "Copier le lien"}
              </button>
            )}
            <button onClick={remove} title="Supprimer" className="px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-red-500 border border-gray-200 dark:border-white/10">&#128465;</button>
          </div>
        </div>
      </div>

      {!editing && (
        <div className="flex gap-1 border-b border-gray-200 dark:border-white/10">
          {([["questions", "Questions"], ["results", "Resultats (" + attempts.length + ")"], ["preview", "Tester"]] as const).map(([k, label]) => (
            <button key={k} onClick={() => { setTab(k); if (k === "preview") retry() }}
              className={"px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors " + (tab === k
                ? "border-violet-500 text-violet-600 dark:text-violet-400"
                : "border-transparent text-gray-500 dark:text-white/40 hover:text-gray-700")}>
              {label}
            </button>
          ))}
        </div>
      )}

      {editing ? (
        <div className="space-y-4">
          <input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white" />
          {attempts.length > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">Attention : {attempts.length} tentative(s) existent deja. Modifier le nombre de questions rend les statistiques par question non comparables.</p>
          )}
          <QuizEditor questions={draft} onChange={setDraft} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3">
            <button onClick={saveEdit} disabled={saving} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40">{saving ? "Enregistrement..." : "Enregistrer"}</button>
            <button onClick={() => setEditing(false)} className="px-4 py-2.5 rounded-xl text-sm text-gray-500 border border-gray-200 dark:border-white/10">Annuler</button>
          </div>
        </div>
      ) : tab === "questions" ? (
        <div className="space-y-3">
          <button onClick={startEdit} className="px-4 py-2 rounded-xl text-sm font-medium border border-violet-300 dark:border-violet-500/40 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-500/10">&#9998; Modifier les questions</button>
          {quiz.questions.map((q, i) => {
            const pq = perQuestion.find((p) => p.questionId === q.id)
            return (
              <div key={q.id} className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-gray-900 dark:text-white"><span className="text-violet-600 dark:text-violet-400 font-bold mr-2">{i + 1}.</span>{q.question}</p>
                  {pq?.percentCorrect !== null && pq?.percentCorrect !== undefined && (
                    <span className="shrink-0 text-xs text-gray-500">{pq.percentCorrect}% reussite</span>
                  )}
                </div>
                <ul className="text-sm space-y-1">
                  {q.options.map((o, j) => (
                    <li key={j} className={j === q.correctIndex ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-gray-600 dark:text-white/60"}>
                      {LETTERS[j]}. {o}{j === q.correctIndex ? " \u2713" : ""}
                    </li>
                  ))}
                </ul>
                {q.explanation && <p className="text-xs text-gray-500 dark:text-white/40">&#128161; {q.explanation}</p>}
              </div>
            )
          })}
        </div>
      ) : tab === "results" ? (
        attempts.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500 dark:text-white/40 rounded-2xl border border-dashed border-gray-300 dark:border-white/15">
            Aucune tentative pour l&apos;instant.{!quiz.published ? " Publie le QCM pour que les eleves puissent y repondre." : ""}
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-white/60">{attempts.length} tentative(s) · moyenne <strong>{avg}%</strong></p>
            <div className="rounded-2xl border border-gray-200 dark:border-white/[0.07] divide-y divide-gray-100 dark:divide-white/5 overflow-hidden bg-white dark:bg-white/[0.03]">
              {attempts.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-gray-800 dark:text-white/80 truncate">{a.student}</span>
                  <span className="shrink-0 text-gray-500 dark:text-white/40 text-xs">{new Date(a.createdAt).toLocaleString("fr-FR")}</span>
                  <span className="shrink-0 font-bold text-violet-600 dark:text-violet-400 w-14 text-right">{a.score}/{a.total}</span>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">Apercu comme un eleve. Tes reponses ne sont pas enregistrees dans les statistiques.</p>
          {takeQuiz(quiz.questions)}
        </div>
      )}
    </div>
  )
}
