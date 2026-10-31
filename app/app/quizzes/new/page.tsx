"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import QuizEditor, { QuizQ, validateQuestions, cleanQuestions } from "@/components/app/QuizEditor"

interface DeckOpt { id: string; name: string }

export default function NewQuizPage() {
  const router = useRouter()
  const [source, setSource] = useState<"manual" | "text" | "deck" | "import">("manual")
  const [notice, setNotice] = useState("")
  const [text, setText] = useState("")
  const [decks, setDecks] = useState<DeckOpt[]>([])
  const [deckId, setDeckId] = useState("")
  const [count, setCount] = useState(10)
  const [generating, setGenerating] = useState(false)
  const [questions, setQuestions] = useState<QuizQ[]>([])
  const [title, setTitle] = useState("")
  const [linkDeckId, setLinkDeckId] = useState("")
  const [publish, setPublish] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null)

  useEffect(() => {
    fetch("/api/quizzes").then((r) => r.json()).then((d) => setIsTeacher(d.role === "TEACHER"))
    fetch("/api/decks").then((r) => r.json()).then((d) => setDecks(d.decks ?? []))
  }, [])

  async function generate() {
    setError("")
    setNotice("")
    setGenerating(true)
    try {
      const isImport = source === "import"
      const res = await fetch(isImport ? "/api/quizzes/import" : "/api/quizzes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isImport ? { text } : source === "deck" ? { deckId, count } : { text, count }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Erreur"); return }
      setQuestions(isImport ? [...questions, ...data.questions] : data.questions)
      if (isImport) setNotice(data.questions.length + " question(s) importee(s)" + (data.skipped ? ", " + data.skipped + " ignoree(s) (format non reconnu)" : "") + ". Verifie les bonnes reponses ci-dessous.")
      if (isImport) setText("")
      if (!title.trim()) {
        const d = decks.find((x) => x.id === deckId)
        setTitle(source === "deck" && d ? "QCM : " + d.name : "")
      }
      if (source === "deck" && deckId) setLinkDeckId(deckId)
    } catch {
      setError("Connexion impossible")
    } finally {
      setGenerating(false)
    }
  }

  async function save() {
    setError("")
    if (!title.trim()) { setError("Donne un titre au QCM."); return }
    const v = validateQuestions(questions)
    if (v) { setError(v); return }
    setSaving(true)
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, deckId: linkDeckId || null, published: publish,
          questions: cleanQuestions(questions),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Erreur"); return }
      router.push("/app/quizzes/" + data.id)
    } catch {
      setError("Connexion impossible")
    } finally {
      setSaving(false)
    }
  }

  const canGenerate = source === "manual" ? false : source === "deck" ? !!deckId : source === "import" ? text.trim().length >= 30 : text.trim().length >= 100

  if (isTeacher === false) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center space-y-3">
        <p className="text-gray-600 dark:text-white/60">Seuls les enseignants peuvent creer des QCM.</p>
        <Link href="/app/courses" className="text-violet-600 dark:text-violet-400 text-sm hover:underline">Passer en mode enseignant (page Cours)</Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <div>
        <Link href="/app/quizzes" className="text-xs text-gray-400 hover:text-violet-500">&larr; Mes QCM</Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">&#128221; Nouveau QCM</h1>
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] space-y-4">
        <div className="flex gap-2 flex-wrap">
          {([["manual", "Saisir mes questions"], ["text", "Generer depuis un texte"], ["deck", "Depuis un de mes decks"], ["import", "Importer mes questions"]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setSource(k)}
              className={"px-4 py-2 rounded-xl text-sm font-medium border transition-colors " + (source === k
                ? "bg-violet-600 text-white border-violet-600"
                : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:border-violet-400")}>
              {label}
            </button>
          ))}
        </div>

        {source === "manual" ? (
          <p className="text-sm text-gray-500 dark:text-white/50">Saisis ta question, remplis les reponses possibles et coche celles qui sont correctes. Active &quot;Plusieurs bonnes reponses&quot; si besoin. Aucun quota consomme.</p>
        ) : source === "import" ? (
          <div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12}
              placeholder={"Colle une ou plusieurs questions telles quelles : enonce, options A/B/C/D, bonne reponse, justifications...\nLes mentions parasites (Learn more, Selectionne...) sont ignorees. Le texte n'est pas reformule."}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none font-mono" />
            <p className="text-xs text-gray-400 mt-1">Une seule bonne reponse par question. Les questions importees s&apos;ajoutent a celles deja presentes. Pas de quota consomme.</p>
          </div>
        ) : source === "text" ? (
          <div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8}
              placeholder="Colle ton cours ici (minimum 100 caracteres)..."
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none" />
            <p className="text-xs text-gray-400 mt-1">{text.length.toLocaleString("fr-FR")} / 30 000 caracteres</p>
          </div>
        ) : (
          <select value={deckId} onChange={(e) => setDeckId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#0c0c1d] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white">
            <option value="">Choisir un deck...</option>
            {decks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}

        {source !== "manual" && <div className="flex items-center gap-3 flex-wrap">
          {source !== "import" && (<>
            <label className="text-sm text-gray-600 dark:text-white/60">Nombre de questions</label>
            <input type="number" min={3} max={30} value={count}
              onChange={(e) => setCount(Math.min(30, Math.max(3, Number(e.target.value) || 10)))}
              className="w-20 px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white" />
          </>)}
          <button onClick={generate} disabled={!canGenerate || generating}
            className="ml-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 transition-all">
            {source === "import" ? (generating ? "Analyse..." : "\uD83D\uDCE5 Importer ces questions") : generating ? "Generation..." : questions.length ? "Regenerer" : "\u26A1 Generer le QCM"}
          </button>
        </div>}
        {source !== "import" && source !== "manual" && <p className="text-xs text-gray-400">Une generation compte dans ton quota mensuel (partage avec les flashcards). Tu pourras tout modifier avant de publier.</p>}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {notice && <p className="text-sm text-emerald-600 dark:text-emerald-400">{notice}</p>}

      {(source === "manual" || questions.length > 0) && (
        <>
          <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du QCM"
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-sm text-gray-600 dark:text-white/60">Cours associe</label>
              <select value={linkDeckId} onChange={(e) => setLinkDeckId(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white dark:bg-[#0c0c1d] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white">
                <option value="">Aucun</option>
                {decks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <span className="text-xs text-gray-400">Les eleves inscrits a ce cours verront le QCM une fois publie.</span>
            </div>
          </div>

          <QuizEditor questions={questions} onChange={setQuestions} />

          <div className="flex items-center gap-4 flex-wrap sticky bottom-20 md:bottom-4 p-4 rounded-2xl bg-white/90 dark:bg-[#0c0c1d]/90 backdrop-blur border border-gray-200 dark:border-white/10">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-white/70">
              <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} className="accent-violet-600" />
              Publier tout de suite
            </label>
            <button onClick={save} disabled={saving}
              className="ml-auto px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 transition-colors">
              {saving ? "Enregistrement..." : "Enregistrer le QCM"}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
