import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const MAX_CHARS = 30_000

const LANG_NAMES: Record<string, string> = {
  fr: 'French',
  en: 'English',
  es: 'Spanish',
  de: 'German',
  ar: 'Arabic',
  pt: 'Portuguese',
  it: 'Italian',
  zh: 'Chinese (Simplified)',
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const { text, targetLang } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: 'Texte manquant' }, { status: 400 })
  if (!targetLang?.trim()) return NextResponse.json({ error: 'Langue cible manquante' }, { status: 400 })

  if (text.length > MAX_CHARS) {
    return NextResponse.json({ error: 'Texte trop long (max 30 000 caracteres)' }, { status: 400 })
  }

  const langName = LANG_NAMES[targetLang.toLowerCase()] ?? targetLang

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a professional translator. Translate the following text to ${langName}. Output only the translated text, no commentary, no explanation, no quotes.`,
      },
      { role: 'user', content: text.trim() },
    ],
    temperature: 0.2,
  })

  const translated = completion.choices[0]?.message?.content?.trim() ?? ''
  if (!translated) return NextResponse.json({ error: 'Traduction vide' }, { status: 500 })

  return NextResponse.json({ translated, targetLang, langName })
}
