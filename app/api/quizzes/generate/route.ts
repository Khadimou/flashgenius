import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateQuiz, MAX_QUESTIONS } from '@/lib/quiz'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const FREE_MONTHLY_LIMIT = 10

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isPremium: true, generationsCount: true, generationsResetAt: true },
  })
  if (user?.role !== 'TEACHER') {
    return NextResponse.json({ error: "Seuls les enseignants peuvent creer des QCM" }, { status: 403 })
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const needsReset = user.generationsResetAt < monthStart
  const currentCount = needsReset ? 0 : user.generationsCount
  if (!user.isPremium && currentCount >= FREE_MONTHLY_LIMIT) {
    return NextResponse.json({
      error: `Limite atteinte : ${FREE_MONTHLY_LIMIT} generations gratuites par mois (partagees avec les flashcards).`,
      limitReached: true,
    }, { status: 429 })
  }

  const body = await req.json()
  const count = Math.min(Math.max(parseInt(body.count, 10) || 10, 3), MAX_QUESTIONS)
  let text: string = typeof body.text === 'string' ? body.text.trim() : ''

  if (body.deckId) {
    const deck = await prisma.deck.findFirst({
      where: { id: body.deckId, userId },
      include: { cards: { orderBy: { position: 'asc' }, select: { question: true, answer: true } } },
    })
    if (!deck) return NextResponse.json({ error: 'Cours introuvable' }, { status: 404 })
    text = deck.cards.map((c) => `${c.question}\n${c.answer}`).join('\n\n')
  }

  if (text.length < 100) {
    return NextResponse.json({ error: 'Contenu trop court (minimum 100 caracteres) pour creer un QCM' }, { status: 400 })
  }
  if (text.length > 30000) {
    return NextResponse.json({ error: 'Contenu trop long (maximum 30 000 caracteres)' }, { status: 400 })
  }

  try {
    const questions = await generateQuiz(text, count)
    if (!questions.length) {
      return NextResponse.json({ error: "L'IA n'a pas pu produire de QCM valide. Reessaie." }, { status: 502 })
    }
    await prisma.user.update({
      where: { id: userId },
      data: {
        generationsCount: needsReset ? 1 : { increment: 1 },
        ...(needsReset ? { generationsResetAt: now } : {}),
      },
    })
    return NextResponse.json({ questions })
  } catch (e) {
    console.error('quiz generate:', e)
    return NextResponse.json({ error: 'Erreur lors de la generation du QCM' }, { status: 500 })
  }
}
