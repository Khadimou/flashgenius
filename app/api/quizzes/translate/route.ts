import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { openai } from '@/lib/openai'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const LANG_NAMES: Record<string, string> = {
  fr: 'French', en: 'English', es: 'Spanish', de: 'German',
  ar: 'Arabic', pt: 'Portuguese', it: 'Italian', zh: 'Chinese (Simplified)',
}

interface Q {
  question: string
  options: string[]
  explanation: string
  optionExplanations: string[]
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const { questions, targetLang, title } = await req.json()
  const lang = LANG_NAMES[String(targetLang ?? '').toLowerCase()]
  if (!lang) return NextResponse.json({ error: 'Langue non supportee' }, { status: 400 })
  if (!Array.isArray(questions) || questions.length === 0 || questions.length > 30) {
    return NextResponse.json({ error: 'Questions invalides' }, { status: 400 })
  }

  // Only text fields are sent: correct answers and order never leave the client, so they cannot be altered.
  const payload: Q[] = questions.map((q: Partial<Q>) => ({
    question: String(q.question ?? ''),
    options: Array.isArray(q.options) ? q.options.map((o) => String(o ?? '')) : [],
    explanation: String(q.explanation ?? ''),
    optionExplanations: Array.isArray(q.optionExplanations) ? q.optionExplanations.map((o) => String(o ?? '')) : [],
  }))
  if (JSON.stringify(payload).length > 40_000) {
    return NextResponse.json({ error: 'QCM trop long pour etre traduit en une fois' }, { status: 400 })
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate every string value of the JSON you receive into ${lang}.
Rules: keep the exact same JSON structure, the same number of questions, the same number of items and the same order in every array. Keep empty strings empty. Do not translate code, commands, ARNs, service/product names (e.g. AWS Lambda, Amazon S3), or acronyms. Do not add commentary.
Return ONLY valid JSON: {"title":"","questions":[{"question":"","options":[],"explanation":"","optionExplanations":[]}]}`,
        },
        { role: 'user', content: JSON.stringify({ title: typeof title === 'string' ? title : '', questions: payload }) },
      ],
    })
    const parsed = JSON.parse(completion.choices[0].message.content ?? '{}')
    const out = parsed.questions
    if (!Array.isArray(out) || out.length !== payload.length) throw new Error('shape')

    const translated = payload.map((src, i) => {
      const t = out[i] ?? {}
      const same = (a: unknown, n: number) => Array.isArray(a) && a.length === n && a.every((x) => typeof x === 'string')
      if (typeof t.question !== 'string' || !same(t.options, src.options.length)) throw new Error('shape')
      return {
        question: t.question,
        options: t.options as string[],
        explanation: typeof t.explanation === 'string' ? t.explanation : src.explanation,
        optionExplanations: same(t.optionExplanations, src.optionExplanations.length)
          ? (t.optionExplanations as string[])
          : src.optionExplanations,
      }
    })
    return NextResponse.json({ questions: translated, title: typeof parsed.title === 'string' ? parsed.title : '' })
  } catch (e) {
    console.error('quiz translate:', e)
    return NextResponse.json({ error: 'Echec de la traduction, reessaie' }, { status: 500 })
  }
}
