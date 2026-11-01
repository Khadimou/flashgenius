"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import QuizEditor, { QuizQ, validateQuestions, cleanQuestions } from "@/components/app/QuizEditor"

interface TrQ { question: string; options: string[]; explanation: string; optionExplanations: string[] }
type Translations = Record<string, { title: string; questions: TrQ[] }>
const LANGS: [string, string][] = [["en", "Anglais"], ["fr", "Francais"], ["es", "Espagnol"], ["de", "Allemand"], ["pt", "Portugais"], ["it", "Italien"], ["ar", "Arabe"], ["zh", "Chinois"]]
const langName = (c: string) => LANGS.find(([k]) => k === c)?.[1] ?? c

interface OwnerQuestion extends QuizQ { id: string }
interface OwnerData {
  isOwner: true
  quiz: { id: string; title: string; translations: Translations; published: boolean; deck: { id: string; name: string } | null; questions: OwnerQuestion[] }
  attempts: { id: string; score: number; total: number; createdAt: string; student: string }[]
  perQuestion: { questionId: string; percentCorrect: number | null }[]
}
interface StudentData {
  isOwner: false
  quiz: { id: string; title: string; translations: Translations; teacher: string | null; deckName: string | null; questions: { id: string; question: string; options: string[]; selectCount: number }[] }
  myAttempts: { score: number; total: number; createdAt: string }[]
}
interface Correction { questionId: string; chosen: number[]; correctIndices: number[]; isCorrect: boolean; explanation: string; optionExplanations: string[] }
interface Result { score: number; total: number; corrections: Correction[] }

const LETTERS = "ABCDEF"

export default function QuizDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<OwnerData | StudentData | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [answers, setAnswers] = useState<number[][]>([])
  const [result, setResult] = useState<Result | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [tab, setTab] = useState<"questions" | "results" | "preview" | "langs">("questions")
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<QuizQ[]>([])
  const [draftTitle, setDraftTitle] = useState("")
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [lang, setLang] = useState("")
  const [addLang, setAddLang] = useState("")
  const [trBusy, setTrBusy] = useState(false)
  const [trEditing, setTrEditing] = useState("")
  const [trTitle, setTrTitle] = useState("")
  const [trDraft, setTrDraft] = useState<TrQ[]>([])

  async function load() {
    const res = await fetch("/api/quizzes/" + id)
    if (!res.ok) { setNotFound(true); return }
    const d = await res.json()
    setData(d)
    setAnswers(d.quiz.questions.map(() => []))
    setResult(null)
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [id])

  async function submit() {
    if (!data) return
    if (answers.some((a) => a.length === 0) && !confirm("Certaines questions n'ont pas de reponse. Valider quand meme ?")) return
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
    setAnswers(data.quiz.questions.map(() => []))
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
    setDraft(data.quiz.questions.map(({ question, options, correctIndices, explanation, optionExplanations }) => ({ question, options: [...options], correctIndices: [...correctIndices], explanation, optionExplanations: options.map((_, k) => optionExplanations?.[k] ?? "") })))
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

  async function saveTranslations(map: Translations) {
    const res = await fetch("/api/quizzes/" + id, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ translations: map }),
    })
    if (!res.ok) { setError((await res.json()).error ?? "Erreur"); return false }
    await load()
    return true
  }

  async function translateTo(code: string) {
    if (!data || !data.isOwner || !code) return
    setError("")
    setTrBusy(true)
    try {
      const res = await fetch("/api/quizzes/translate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetLang: code, title: data.quiz.title, questions: data.quiz.questions }),
      })
      const r = await res.json()
      if (!res.ok) { setError(r.error ?? "Erreur"); return }
      if (await saveTranslations({ ...data.quiz.translations, [code]: { title: r.title || data.quiz.title, questions: r.questions } })) setAddLang("")
    } catch {
      setError("Connexion impossible")
    } finally {
      setTrBusy(false)
    }
  }

  function startTrEdit(code: string) {
    if (!data || !data.isOwner) return
    const t = data.quiz.translations[code]
    setTrDraft(t.questions.map((q) => ({ ...q, options: [...q.options], optionExplanations: [...q.optionExplanations] })))
    setTrTitle(t.title)
    setTrEditing(code)
    setError("")
  }

  async function saveTrEdit() {
    if (!data || !data.isOwner) return
    if (!trTitle.trim() || trDraft.some((q) => !q.question.trim() || q.options.some((o) => !o.trim()))) { setError("Le titre, les enonces et toutes les options doivent etre remplis."); return }
    setTrBusy(true)
    const ok = await saveTranslations({ ...data.quiz.translations, [trEditing]: { title: trTitle, questions: trDraft } })
    setTrBusy(false)
    if (ok) setTrEditing("")
  }

  async function removeTr(code: string) {
    if (!data || !data.isOwner || !confirm("Supprimer la version " + langName(code) + " ?")) return
    const next = { ...data.quiz.translations }
    delete next[code]
    if (lang === code) setLang("")
    await saveTranslations(next)
  }

  if (notFound) return <div className="max-w-xl mx-auto px-6 py-16 text-center text-gray-500">QCM introuvable. <Link href="/app/quizzes" className="text-violet-500 hover:underline">Retour</Link></div>
  if (!data) return <div className="max-w-3xl mx-auto px-6 py-10 text-sm text-gray-400">Chargement...</div>

  const translations: Translations = data.quiz.translations ?? {}
  const T = lang ? translations[lang] : undefined
  const langBar = Object.keys(translations).length > 0 && (
    <div className="flex items-center gap-2 flex-wrap text-sm">
      <span className="text-gray-500 dark:text-white/50">Langue :</span>
      {[["", "Original"], ...Object.keys(translations).map((c) => [c, langName(c)])].map(([c, l]) => (
        <button key={c} onClick={() => setLang(c)}
          className={"px-3 py-1 rounded-lg border text-xs font-medium " + (lang === c ? "bg-violet-600 text-white border-violet-600" : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:border-violet-400")}>{l}</button>
      ))}
    </div>
  )

  const takeQuiz = (questions: { id: string; question: string; options: string[]; selectCount?: number }[]) => (
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
        const need = q.selectCount ?? 1
        const toggle = (j: number) => setAnswers((a) => a.map((v, k) => {
          if (k !== i) return v
          if (need <= 1) return [j]
          return v.includes(j) ? v.filter((x) => x !== j) : [...v, j]
        }))
        return (
          <div key={q.id} className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] space-y-3">
            <p className="font-medium text-gray-900 dark:text-white"><span className="text-violet-600 dark:text-violet-400 font-bold mr-2">{i + 1}.</span>{T?.questions[i]?.question ?? q.question}</p>
            {need > 1 && !corr && (
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Choisissez {need} reponses ({answers[i]?.length ?? 0}/{need} selectionnee{(answers[i]?.length ?? 0) > 1 ? "s" : ""})</p>
            )}
            <div className="space-y-2">
              {(T?.questions[i]?.options ?? q.options).map((o, j) => {
                const selected = corr ? corr.chosen.includes(j) : (answers[i] ?? []).includes(j)
                let cls = "border-gray-200 dark:border-white/10 hover:border-violet-400"
                if (corr) {
                  if (corr.correctIndices.includes(j)) cls = "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                  else if (selected) cls = "border-red-400 bg-red-50 dark:bg-red-500/10"
                  else cls = "border-gray-200 dark:border-white/10 opacity-60"
                } else if (selected) cls = "border-violet-500 bg-violet-50 dark:bg-violet-500/10"
                const just = (T?.questions[i]?.optionExplanations?.[j] || corr?.optionExplanations?.[j])
                return (
                  <div key={j}>
                    <button disabled={!!result} onClick={() => toggle(j)}
                      className={"w-full text-left px-4 py-2.5 rounded-xl border text-sm text-gray-800 dark:text-white/85 transition-colors " + cls}>
                      <span className="font-bold mr-2 text-gray-400">{LETTERS[j]}</span>{o}
                      {corr && corr.correctIndices.includes(j) && <span className="ml-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Bonne reponse</span>}
                      {corr && selected && !corr.correctIndices.includes(j) && <span className="ml-2 text-xs font-semibold text-red-500">Ta reponse</span>}
                    </button>
                    {just && <p className="text-xs text-gray-500 dark:text-white/50 px-4 pt-1">{just}</p>}
                  </div>
                )
              })}
            </div>
            {corr && (T?.questions[i]?.explanation || corr.explanation) && (
              <p className="text-xs text-gray-500 dark:text-white/50 pl-1">&#128161; {T?.questions[i]?.explanation || corr.explanation}</p>
            )}
          </div>
        )
      })}
      {!result && questions.some((q) => (q.selectCount ?? 1) > 1) && (
        <p className="text-xs text-gray-400">Questions a reponses multiples : la question est comptee juste uniquement si tu coches exactement toutes les bonnes reponses.</p>
      )}
      {!result && (
        <button onClick={submit} disabled={submitting}
          className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 transition-all">
          {submitting ? "Correction..." : "Valider mes reponses (" + answers.filter((a) => a.length > 0).length + "/" + questions.length + ")"}
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{T?.title ?? data.quiz.title}</h1>
          <p className="text-xs text-gray-500 dark:text-white/40 mt-1">
            {data.quiz.questions.length} questions{data.quiz.teacher ? " · " + data.quiz.teacher : ""}
            {data.myAttempts.length > 0 ? " · derniere note : " + data.myAttempts[0].score + "/" + data.myAttempts[0].total : ""}
          </p>
        </div>
        {langBar}
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
          {([["questions", "Questions"], ["results", "Resultats (" + attempts.length + ")"], ["preview", "Tester"], ["langs", "Langues (" + Object.keys(quiz.translations ?? {}).length + ")"]] as const).map(([k, label]) => (
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
          {langBar}
          {quiz.questions.map((q, i) => {
            const pq = perQuestion.find((p) => p.questionId === q.id)
            return (
              <div key={q.id} className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-gray-900 dark:text-white"><span className="text-violet-600 dark:text-violet-400 font-bold mr-2">{i + 1}.</span>{T?.questions[i]?.question ?? q.question}</p>
                  {q.correctIndices.length > 1 && <span className="shrink-0 text-xs text-amber-600 dark:text-amber-400">{q.correctIndices.length} reponses</span>}
                  {pq?.percentCorrect !== null && pq?.percentCorrect !== undefined && (
                    <span className="shrink-0 text-xs text-gray-500">{pq.percentCorrect}% reussite</span>
                  )}
                </div>
                <ul className="text-sm space-y-1">
                  {(T?.questions[i]?.options ?? q.options).map((o, j) => (
                    <li key={j} className={q.correctIndices.includes(j) ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-gray-600 dark:text-white/60"}>
                      {LETTERS[j]}. {o}{q.correctIndices.includes(j) ? " \u2713" : ""}
                      {(T ? T.questions[i]?.optionExplanations?.[j] : q.optionExplanations?.[j]) && <span className="block text-xs font-normal text-gray-500 dark:text-white/40">{T ? T.questions[i]?.optionExplanations?.[j] : q.optionExplanations?.[j]}</span>}
                    </li>
                  ))}
                </ul>
                {(T ? T.questions[i]?.explanation : q.explanation) && <p className="text-xs text-gray-500 dark:text-white/40">&#128161; {T ? T.questions[i]?.explanation : q.explanation}</p>}
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
      ) : tab === "langs" ? (
        <div className="space-y-4">
          <p className="text-xs text-gray-400">Chaque langue est une version du meme QCM : memes questions, memes bonnes reponses. Les eleves choisissent la langue en haut du QCM. Si tu changes la structure de l&apos;original (nombre de questions ou d&apos;options), les versions qui ne correspondent plus sont supprimees : il faudra les retraduire.</p>
          {Object.keys(quiz.translations ?? {}).map((code) => trEditing === code ? (
            <div key={code} className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-violet-300 dark:border-violet-500/40 space-y-3">
              <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">Modifier la version {langName(code)}</p>
              <input value={trTitle} onChange={(e) => setTrTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white" />
              {trDraft.map((q, i) => {
                const patchQ = (p: Partial<TrQ>) => setTrDraft((d) => d.map((x, k) => k === i ? { ...x, ...p } : x))
                const inp = "w-full px-3 py-1.5 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white"
                return (
                  <div key={i} className="space-y-2 pt-2 border-t border-gray-100 dark:border-white/5">
                    <textarea value={q.question} rows={2} onChange={(e) => patchQ({ question: e.target.value })} className={inp + " resize-none"} />
                    {q.options.map((o, j) => (
                      <div key={j} className="pl-4 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={"text-xs font-bold " + (quiz.questions[i]?.correctIndices.includes(j) ? "text-emerald-600" : "text-gray-400")}>{LETTERS[j]}{quiz.questions[i]?.correctIndices.includes(j) ? " \u2713" : ""}</span>
                          <input value={o} onChange={(e) => patchQ({ options: q.options.map((x, k) => k === j ? e.target.value : x) })} className={inp} />
                        </div>
                        <input value={q.optionExplanations[j] ?? ""} placeholder="Justification" onChange={(e) => patchQ({ optionExplanations: q.options.map((_, k) => k === j ? e.target.value : (q.optionExplanations[k] ?? "")) })} className={inp + " text-xs"} />
                      </div>
                    ))}
                    <input value={q.explanation} placeholder="Explication generale" onChange={(e) => patchQ({ explanation: e.target.value })} className={inp + " text-xs"} />
                  </div>
                )
              })}
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-3">
                <button onClick={saveTrEdit} disabled={trBusy} className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40">{trBusy ? "Enregistrement..." : "Enregistrer"}</button>
                <button onClick={() => setTrEditing("")} className="px-4 py-2 rounded-xl text-sm text-gray-500 border border-gray-200 dark:border-white/10">Annuler</button>
              </div>
            </div>
          ) : (
            <div key={code} className="flex items-center gap-2 flex-wrap p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07]">
              <span className="font-medium text-sm text-gray-900 dark:text-white">{langName(code)}</span>
              <span className="text-xs text-gray-400 truncate">{quiz.translations[code].title}</span>
              <div className="ml-auto flex gap-2">
                <button onClick={() => { setLang(code); setTab("questions") }} className="px-3 py-1 rounded-lg text-xs border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:border-violet-400">Voir</button>
                <button onClick={() => startTrEdit(code)} className="px-3 py-1 rounded-lg text-xs border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:border-violet-400">Modifier</button>
                <button onClick={() => translateTo(code)} disabled={trBusy} className="px-3 py-1 rounded-lg text-xs border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:border-violet-400 disabled:opacity-40">{trBusy ? "..." : "Retraduire"}</button>
                <button onClick={() => removeTr(code)} className="px-2 py-1 text-gray-400 hover:text-red-500">&#128465;</button>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20">
            <select value={addLang} onChange={(e) => setAddLang(e.target.value)} className="px-2 py-1.5 rounded-lg bg-white dark:bg-[#0c0c1d] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white">
              <option value="">Ajouter une langue...</option>
              {LANGS.filter(([k]) => !(quiz.translations ?? {})[k]).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <button onClick={() => translateTo(addLang)} disabled={!addLang || trBusy} className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40">{trBusy ? "Traduction..." : "Traduire et ajouter"}</button>
            <span className="text-xs text-gray-400">Gratuit, sans quota.</span>
          </div>
          {error && trEditing === "" && <p className="text-sm text-red-500">{error}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {langBar}
          <p className="text-xs text-gray-400">Apercu comme un eleve. Tes reponses ne sont pas enregistrees dans les statistiques.</p>
          {takeQuiz(quiz.questions.map((q) => ({ id: q.id, question: q.question, options: q.options, selectCount: q.correctIndices.length })))}
        </div>
      )}
    </div>
  )
}
