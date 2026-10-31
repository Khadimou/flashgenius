"use client"

export interface QuizQ {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

const INPUT = "w-full px-3 py-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50"

export default function QuizEditor({ questions, onChange }: { questions: QuizQ[]; onChange: (q: QuizQ[]) => void }) {
  function patch(i: number, p: Partial<QuizQ>) {
    onChange(questions.map((q, idx) => (idx === i ? { ...q, ...p } : q)))
  }
  function setOption(i: number, j: number, value: string) {
    const opts = questions[i].options.map((o, k) => (k === j ? value : o))
    patch(i, { options: opts })
  }
  function addOption(i: number) {
    if (questions[i].options.length >= 6) return
    patch(i, { options: [...questions[i].options, ""] })
  }
  function removeOption(i: number, j: number) {
    const q = questions[i]
    if (q.options.length <= 2) return
    const options = q.options.filter((_, k) => k !== j)
    let correctIndex = q.correctIndex
    if (j === correctIndex) correctIndex = 0
    else if (j < correctIndex) correctIndex -= 1
    patch(i, { options, correctIndex })
  }
  function addQuestion() {
    onChange([...questions, { question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" }])
  }
  function removeQuestion(i: number) {
    onChange(questions.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div key={i} className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] space-y-3">
          <div className="flex items-start gap-2">
            <span className="shrink-0 mt-2 text-xs font-bold text-violet-600 dark:text-violet-400">Q{i + 1}</span>
            <textarea value={q.question} onChange={(e) => patch(i, { question: e.target.value })}
              rows={2} placeholder="Enonce de la question" className={INPUT + " resize-none"} />
            <button onClick={() => removeQuestion(i)} title="Supprimer la question"
              className="shrink-0 mt-1 px-2 py-1 text-gray-400 hover:text-red-500 transition-colors">&#128465;</button>
          </div>

          <div className="space-y-2 pl-6">
            {q.options.map((o, j) => (
              <div key={j} className="flex items-center gap-2">
                <input type="radio" name={"correct-" + i} checked={q.correctIndex === j}
                  onChange={() => patch(i, { correctIndex: j })}
                  title="Bonne reponse" className="accent-emerald-500 shrink-0" />
                <input value={o} onChange={(e) => setOption(i, j, e.target.value)}
                  placeholder={"Proposition " + String.fromCharCode(65 + j)}
                  className={INPUT + (q.correctIndex === j ? " !border-emerald-400/60" : "")} />
                {q.options.length > 2 && (
                  <button onClick={() => removeOption(i, j)} className="text-gray-300 hover:text-red-500 text-sm shrink-0">&#10005;</button>
                )}
              </div>
            ))}
            <div className="flex items-center justify-between">
              {q.options.length < 6 ? (
                <button onClick={() => addOption(i)} className="text-xs text-violet-600 dark:text-violet-400 hover:underline">+ Ajouter une proposition</button>
              ) : <span />}
              <span className="text-[11px] text-gray-400">Le bouton rond = bonne reponse</span>
            </div>
            <input value={q.explanation} onChange={(e) => patch(i, { explanation: e.target.value })}
              placeholder="Explication affichee apres correction (optionnel)" className={INPUT} />
          </div>
        </div>
      ))}

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
    const filled = q.options.filter((o) => o.trim())
    if (filled.length < 2) return "Question " + (i + 1) + " : au moins 2 propositions."
    if (!q.options[q.correctIndex]?.trim()) return "Question " + (i + 1) + " : la bonne reponse est vide."
  }
  return null
}

/** Drop empty options and remap correctIndex accordingly. */
export function cleanQuestions(qs: QuizQ[]): QuizQ[] {
  return qs.map((q) => {
    const keep = q.options.map((o, idx) => ({ o: o.trim(), idx })).filter((x) => x.o)
    return {
      question: q.question.trim(),
      options: keep.map((x) => x.o),
      correctIndex: keep.findIndex((x) => x.idx === q.correctIndex),
      explanation: q.explanation.trim(),
    }
  })
}
