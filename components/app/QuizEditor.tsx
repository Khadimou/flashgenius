"use client"

import { useState } from "react"

export interface QuizQ {
  question: string
  options: string[]
  correctIndices: number[]
  explanation: string
  optionExplanations: string[]
  /** UI only: question allows several correct answers */
  multiple?: boolean
}

const INPUT = "w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50"

const LANGS: [string, string][] = [["en", "Anglais"], ["fr", "Francais"], ["es", "Espagnol"], ["de", "Allemand"], ["pt", "Portugais"], ["it", "Italien"], ["ar", "Arabe"], ["zh", "Chinois"]]

export default function QuizEditor({ questions, onChange }: { questions: QuizQ[]; onChange: (q: QuizQ[]) => void }) {
  function patch(i: number, p: Partial<QuizQ>) {
    onChange(questions.map((q, idx) => (idx === i ? { ...q, ...p } : q)))
  }
  const isMulti = (q: QuizQ) => q.multiple ?? q.correctIndices.length > 1

  function setOption(i: number, j: number, value: string) {
    patch(i, { options: questions[i].options.map((o, k) => (k === j ? value : o)) })
  }
  function setOptionExp(i: number, j: number, value: string) {
    const q = questions[i]
    patch(i, { optionExplanations: q.options.map((_, k) => (k === j ? value : (q.optionExplanations[k] ?? ""))) })
  }
  function toggleCorrect(i: number, j: number) {
    const q = questions[i]
    if (!isMulti(q)) { patch(i, { correctIndices: [j] }); return }
    const has = q.correctIndices.includes(j)
    const next = has ? q.correctIndices.filter((c) => c !== j) : [...q.correctIndices, j].sort((a, b) => a - b)
    patch(i, { correctIndices: next })
  }
  function setMultiple(i: number, multiple: boolean) {
    const q = questions[i]
    patch(i, { multiple, correctIndices: !multiple && q.correctIndices.length > 1 ? [q.correctIndices[0]] : q.correctIndices })
  }
  function addOption(i: number) {
    const q = questions[i]
    if (q.options.length >= 6) return
    patch(i, { options: [...q.options, ""], optionExplanations: [...q.options.map((_, k) => q.optionExplanations[k] ?? ""), ""] })
  }
  function removeOption(i: number, j: number) {
    const q = questions[i]
    if (q.options.length <= 2) return
    const correct = q.correctIndices.filter((c) => c !== j).map((c) => (c > j ? c - 1 : c))
    patch(i, {
      options: q.options.filter((_, k) => k !== j),
      optionExplanations: q.options.map((_, k) => q.optionExplanations[k] ?? "").filter((_, k) => k !== j),
      correctIndices: correct.length ? correct : [0],
    })
  }
  function addQuestion() {
    onChange([...questions, { question: "", options: ["", "", "", ""], correctIndices: [0], explanation: "", optionExplanations: ["", "", "", ""] }])
  }
  function removeQuestion(i: number) {
    onChange(questions.filter((_, idx) => idx !== i))
  }

  const [lang, setLang] = useState("en")
  const [translating, setTranslating] = useState(false)
  const [tError, setTError] = useState("")

  async function translateAll() {
    setTError("")
    setTranslating(true)
    try {
      const res = await fetch("/api/quizzes/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetLang: lang, questions }),
      })
      const data = await res.json().catch(() => ({ error: "Delai depasse ou reponse invalide du serveur, reessaie." }))
      if (!res.ok) { setTError(data.error ?? "Erreur"); return }
      onChange(questions.map((q, i) => ({ ...q, ...data.questions[i] })))
    } catch {
      setTError("Connexion impossible")
    } finally {
      setTranslating(false)
    }
  }

  return (
    <div className="space-y-4">
      {questions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20">
          <span className="text-sm text-gray-700 dark:text-white/70">Traduire tout le QCM en</span>
          <select value={lang} onChange={(e) => setLang(e.target.value)}
            className="px-2 py-1.5 rounded-lg bg-white dark:bg-[#0c0c1d] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white">
            {LANGS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button onClick={translateAll} disabled={translating}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40">
            {translating ? "Traduction..." : "Traduire"}
          </button>
          <span className="text-xs text-gray-400">Les bonnes reponses sont conservees. Gratuit, sans quota.</span>
          {tError && <span className="text-xs text-red-500 w-full">{tError}</span>}
        </div>
      )}
      {questions.map((q, i) => {
        const multi = isMulti(q)
        return (
          <div key={i} className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] space-y-3">
            <div className="flex items-start gap-2">
              <span className="shrink-0 mt-2 text-xs font-bold text-violet-600 dark:text-violet-400">Q{i + 1}</span>
              <textarea value={q.question} onChange={(e) => patch(i, { question: e.target.value })}
                rows={2} placeholder="Enonce de la question" className={INPUT + " resize-none"} />
              <button onClick={() => removeQuestion(i)} title="Supprimer la question"
                className="shrink-0 mt-1 px-2 py-1 text-gray-400 hover:text-red-500 transition-colors">&#128465;</button>
            </div>

            <div className="space-y-2 pl-6">
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-white/60 select-none">
                <input type="checkbox" checked={multi} onChange={(e) => setMultiple(i, e.target.checked)} className="accent-violet-600" />
                Plusieurs bonnes reponses
                {multi && <span className="text-gray-400">({q.correctIndices.length} cochee{q.correctIndices.length > 1 ? "s" : ""})</span>}
              </label>

              {q.options.map((o, j) => {
                const correct = q.correctIndices.includes(j)
                return (
                  <div key={j} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <input type={multi ? "checkbox" : "radio"} name={"correct-" + i} checked={correct}
                        onChange={() => toggleCorrect(i, j)}
                        title="Bonne reponse" className="accent-emerald-500 shrink-0" />
                      <input value={o} onChange={(e) => setOption(i, j, e.target.value)}
                        placeholder={"Proposition " + String.fromCharCode(65 + j)}
                        className={INPUT + (correct ? " !border-emerald-400/60" : "")} />
                      {q.options.length > 2 && (
                        <button onClick={() => removeOption(i, j)} className="text-gray-300 hover:text-red-500 text-sm shrink-0">&#10005;</button>
                      )}
                    </div>
                    <input value={q.optionExplanations[j] ?? ""} onChange={(e) => setOptionExp(i, j, e.target.value)}
                      placeholder={"Justification de " + String.fromCharCode(65 + j) + " (optionnel)"}
                      className="w-full ml-6 max-w-[calc(100%-1.5rem)] px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 text-xs text-gray-600 dark:text-white/60 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-400/50" />
                  </div>
                )
              })}
              <div className="flex items-center justify-between">
                {q.options.length < 6 ? (
                  <button onClick={() => addOption(i)} className="text-xs text-violet-600 dark:text-violet-400 hover:underline">+ Ajouter une proposition</button>
                ) : <span />}
                <span className="text-[11px] text-gray-400">{multi ? "Coche toutes les bonnes reponses" : "Le bouton rond = bonne reponse"}</span>
              </div>
              <input value={q.explanation} onChange={(e) => patch(i, { explanation: e.target.value })}
                placeholder="Explication generale apres correction (optionnel)" className={INPUT} />
            </div>
          </div>
        )
      })}

      <button onClick={addQuestion}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/15 text-sm text-gray-500 dark:text-white/50 hover:border-violet-400 hover:text-violet-600 transition-colors">
        + Ajouter une question
      </button>
    </div>
  )
}

export function validateQuestions(qs: QuizQ[]): string | null {
  if (qs.length === 0) return "Ajoute au moins une question."
  for (let i = 0; i < qs.length; i++) {
    const q = qs[i]
    if (!q.question.trim()) return "Question " + (i + 1) + " : enonce vide."
    if (q.options.filter((o) => o.trim()).length < 2) return "Question " + (i + 1) + " : au moins 2 propositions."
    if (q.correctIndices.length === 0) return "Question " + (i + 1) + " : coche au moins une bonne reponse."
    if (q.correctIndices.some((c) => !q.options[c]?.trim())) return "Question " + (i + 1) + " : une bonne reponse est vide."
  }
  return null
}

/** Drop empty options and remap correctIndices accordingly. */
export function cleanQuestions(qs: QuizQ[]): QuizQ[] {
  return qs.map((q) => {
    const keep = q.options.map((o, idx) => ({ o: o.trim(), idx })).filter((x) => x.o)
    return {
      question: q.question.trim(),
      options: keep.map((x) => x.o),
      optionExplanations: keep.map((x) => (q.optionExplanations[x.idx] ?? "").trim()),
      correctIndices: q.correctIndices.map((c) => keep.findIndex((x) => x.idx === c)).filter((c) => c >= 0).sort((a, b) => a - b),
      explanation: q.explanation.trim(),
    }
  })
}
