import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseQuizText } from '@/lib/quiz'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (user?.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Seuls les enseignants peuvent creer des QCM' }, { status: 403 })
  }

  const { text } = await req.json()
  const t = typeof text === 'string' ? text.trim() : ''
  if (t.length < 30) return NextResponse.json({ error: 'Colle au moins une question avec ses options' }, { status: 400 })
  if (t.length > 30000) return NextResponse.json({ error: 'Texte trop long (maximum 30 000 caracteres)' }, { status: 400 })

  try {
    const { questions, skipped } = await parseQuizText(t)
    if (!questions.length) {
      return NextResponse.json({ error: "Aucune question reconnue. Verifie que le texte contient l'enonce et les options." }, { status: 422 })
    }
    return NextResponse.json({ questions, skipped })
  } catch (e) {
    console.error('quiz import:', e)
    return NextResponse.json({ error: "Erreur lors de l'analyse du texte" }, { status: 500 })
  }
}
