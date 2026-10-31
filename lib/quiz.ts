import { openai } from '@/lib/openai'

export interface QuizQuestionDraft {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export const MAX_QUESTIONS = 30

function shuffleWithAnswer(options: string[], correctIndex: number) {
  const idx = options.map((_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return { options: idx.map((i) => options[i]), correctIndex: idx.indexOf(correctIndex) }
}

/** Validate + normalise questions coming from the client or the model. Returns null if invalid. */
export function sanitizeQuestions(input: unknown): QuizQuestionDraft[] | null {
  if (!Array.isArray(input)) return null
  const out: QuizQuestionDraft[] = []
  for (const raw of input.slice(0, MAX_QUESTIONS)) {
    if (!raw || typeof raw !== 'object') return null
    const r = raw as Record<string, unknown>
    const question = typeof r.question === 'string' ? r.question.trim() : ''
    const options = Array.isArray(r.options)
      ? r.options.map((o) => (typeof o === 'string' ? o.trim() : '')).filter(Boolean)
      : []
    const correctIndex = Number(r.correctIndex)
    if (!question || options.length < 2 || options.length > 6) return null
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) return null
    const explanation = typeof r.explanation === 'string' ? r.explanation.trim() : ''
    out.push({ question, options, correctIndex, explanation })
  }
  return out
}

export async function generateQuiz(text: string, count: number): Promise<QuizQuestionDraft[]> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.5,
    max_tokens: 4096,
    messages: [
      {
        role: 'system',
        content: `Tu es un enseignant expert en evaluation. A partir du texte fourni, cree un QCM de ${count} questions.
Regles :
- Ecris dans la langue du texte source
- Chaque question a exactement 4 propositions, dont UNE seule est correcte
- Les mauvaises propositions sont plausibles (pas absurdes), de longueur similaire a la bonne
- Pas de "toutes les reponses" ni "aucune de ces reponses"
- Questions fondees uniquement sur le texte, couvrant des parties differentes
- Une explication courte (1 phrase) qui justifie la bonne reponse
Retourne UNIQUEMENT un JSON valide : {"questions":[{"question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"..."}]}`,
      },
      { role: 'user', content: text },
    ],
  })

  const raw = completion.choices[0].message.content ?? '{}'
  let parsed: { questions?: unknown } = {}
  try { parsed = JSON.parse(raw) } catch { return [] }
  const valid = sanitizeQuestions(parsed.questions) ?? []
  return valid.map((q) => {
    const sh = shuffleWithAnswer(q.options, q.correctIndex)
    return { ...q, options: sh.options, correctIndex: sh.correctIndex }
  })
}
