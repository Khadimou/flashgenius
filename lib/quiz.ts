import { openai } from '@/lib/openai'

export interface QuizQuestionDraft {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  optionExplanations: string[]
}

export const MAX_QUESTIONS = 30

function shuffleQuestion(q: QuizQuestionDraft): QuizQuestionDraft {
  const idx = q.options.map((_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return {
    ...q,
    options: idx.map((i) => q.options[i]),
    optionExplanations: idx.map((i) => q.optionExplanations[i] ?? ''),
    correctIndex: idx.indexOf(q.correctIndex),
  }
}

/** Validate + normalise ONE question. Drops empty options (keeping explanations aligned). */
function sanitizeOne(raw: unknown): QuizQuestionDraft | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const question = typeof r.question === 'string' ? r.question.trim() : ''
  const rawOpts = Array.isArray(r.options) ? r.options : []
  const rawExp = Array.isArray(r.optionExplanations) ? r.optionExplanations : []
  const correctRaw = Number(r.correctIndex)
  if (!question || !Number.isInteger(correctRaw) || correctRaw < 0 || correctRaw >= rawOpts.length) return null

  const pairs = rawOpts
    .map((o, i) => ({
      o: typeof o === 'string' ? o.trim() : '',
      e: typeof rawExp[i] === 'string' ? (rawExp[i] as string).trim() : '',
      i,
    }))
    .filter((p) => p.o)
  const correctIndex = pairs.findIndex((p) => p.i === correctRaw)
  if (pairs.length < 2 || pairs.length > 6 || correctIndex < 0) return null

  return {
    question,
    options: pairs.map((p) => p.o),
    optionExplanations: pairs.map((p) => p.e),
    correctIndex,
    explanation: typeof r.explanation === 'string' ? r.explanation.trim() : '',
  }
}

/** Strict: returns null if any question is invalid (used when saving). */
export function sanitizeQuestions(input: unknown): QuizQuestionDraft[] | null {
  if (!Array.isArray(input)) return null
  const out: QuizQuestionDraft[] = []
  for (const raw of input.slice(0, MAX_QUESTIONS)) {
    const q = sanitizeOne(raw)
    if (!q) return null
    out.push(q)
  }
  return out
}

/** Lenient: keeps valid questions, reports how many were dropped (used for import / AI output). */
function sanitizeLenient(input: unknown): { questions: QuizQuestionDraft[]; skipped: number } {
  if (!Array.isArray(input)) return { questions: [], skipped: 0 }
  const questions: QuizQuestionDraft[] = []
  let skipped = 0
  for (const raw of input.slice(0, MAX_QUESTIONS)) {
    const q = sanitizeOne(raw)
    if (q) questions.push(q)
    else skipped++
  }
  return { questions, skipped }
}

export async function generateQuiz(text: string, count: number): Promise<QuizQuestionDraft[]> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.5,
    max_tokens: 8000,
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
- optionExplanations : pour CHAQUE proposition, une justification courte (1 phrase) expliquant pourquoi elle est correcte ou incorrecte
- explanation : 1 phrase de synthese sur la bonne reponse
Retourne UNIQUEMENT un JSON valide : {"questions":[{"question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"...","optionExplanations":["...","...","...","..."]}]}`,
      },
      { role: 'user', content: text },
    ],
  })

  const raw = completion.choices[0].message.content ?? '{}'
  let parsed: { questions?: unknown } = {}
  try { parsed = JSON.parse(raw) } catch { return [] }
  return sanitizeLenient(parsed.questions).questions.map(shuffleQuestion)
}

/** Extract already-written MCQ questions from pasted text (exam dumps, Word, etc.). No rewriting. */
export async function parseQuizText(text: string): Promise<{ questions: QuizQuestionDraft[]; skipped: number }> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0,
    max_tokens: 8000,
    messages: [
      {
        role: 'system',
        content: `Tu recois du texte copie depuis un QCM / examen (il peut contenir du bruit : "Learn more", "Votre selection", "Selectionne", "Non selectionne", "Bonne reponse", "Correct", "Justification", colonnes d'un tableau, liens, numerotation).
Extrais CHAQUE question a choix multiples.
Regles strictes :
- Conserve le texte EXACT de l'enonce, des options et des justifications : ne traduis pas, ne reformule pas, ne corrige pas
- Retire les prefixes de lettre des options ("A.", "B)", ...) et tout bruit d'interface ("Learn more", "Selectionne", "Correct" ...) ainsi que les liens
- correctIndex = index (base 0) de l'option marquee comme correcte (colonne "Bonne reponse" / "Correct"). Si rien n'est indique, choisis la plus probable
- optionExplanations = la justification propre a chaque option, dans le meme ordre que options ("" si absente)
- explanation = justification generale de la question si elle existe, sinon ""
- Une seule bonne reponse par question
Retourne UNIQUEMENT un JSON valide : {"questions":[{"question":"...","options":["..."],"correctIndex":0,"explanation":"","optionExplanations":["..."]}]}`,
      },
      { role: 'user', content: text },
    ],
  })

  const raw = completion.choices[0].message.content ?? '{}'
  let parsed: { questions?: unknown } = {}
  try { parsed = JSON.parse(raw) } catch { return { questions: [], skipped: 0 } }
  return sanitizeLenient(parsed.questions)
}
