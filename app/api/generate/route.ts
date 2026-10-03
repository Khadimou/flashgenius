import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateFlashcards } from '@/lib/openai'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  try {
    const { text } = await req.json()
    if (!text || text.trim().length < 20) {
      return NextResponse.json({ error: 'Texte trop court (minimum 20 caracteres)' }, { status: 400 })
    }
    if (text.length > 30000) {
      return NextResponse.json({ error: 'Texte trop long (maximum 30 000 caracteres)' }, { status: 400 })
    }
    const cards = await generateFlashcards(text.trim())
    return NextResponse.json({ cards })
  } catch (e) {
    console.error('generate:', e)
    return NextResponse.json({ error: 'Erreur lors de la generation' }, { status: 500 })
  }
}
