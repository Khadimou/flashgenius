import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeQuestions } from '@/lib/quiz'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })

  if (user?.role === 'TEACHER') {
    const quizzes = await prisma.quiz.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        deck: { select: { name: true } },
        _count: { select: { questions: true } },
        attempts: { select: { score: true, total: true } },
      },
    })
    return NextResponse.json({
      role: 'TEACHER',
      quizzes: quizzes.map((q) => ({
        id: q.id, title: q.title, published: q.published, updatedAt: q.updatedAt,
        deckName: q.deck?.name ?? null,
        questionCount: q._count.questions,
        attemptCount: q.attempts.length,
        avgPercent: q.attempts.length
          ? Math.round((q.attempts.reduce((a, t) => a + t.score / Math.max(t.total, 1), 0) / q.attempts.length) * 100)
          : null,
      })),
    })
  }

  const quizzes = await prisma.quiz.findMany({
    where: { published: true, deck: { enrollments: { some: { studentId: userId } } } },
    orderBy: { updatedAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      deck: { select: { name: true } },
      _count: { select: { questions: true } },
      attempts: { where: { studentId: userId }, orderBy: { createdAt: 'desc' }, select: { score: true, total: true } },
    },
  })
  return NextResponse.json({
    role: 'STUDENT',
    quizzes: quizzes.map((q) => ({
      id: q.id, title: q.title,
      teacher: q.user.name ?? q.user.email,
      deckName: q.deck?.name ?? null,
      questionCount: q._count.questions,
      lastScore: q.attempts[0] ? { score: q.attempts[0].score, total: q.attempts[0].total } : null,
      attemptCount: q.attempts.length,
    })),
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (user?.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Seuls les enseignants peuvent creer des QCM' }, { status: 403 })
  }

  const body = await req.json()
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) return NextResponse.json({ error: 'Titre requis' }, { status: 400 })

  const questions = sanitizeQuestions(body.questions)
  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: 'Questions invalides : chaque question doit avoir un enonce, 2 a 6 propositions et une bonne reponse.' }, { status: 400 })
  }

  let deckId: string | null = null
  if (body.deckId) {
    const deck = await prisma.deck.findFirst({ where: { id: body.deckId, userId }, select: { id: true } })
    if (!deck) return NextResponse.json({ error: 'Cours introuvable' }, { status: 404 })
    deckId = deck.id
  }

  const quiz = await prisma.quiz.create({
    data: {
      title, userId, deckId, published: !!body.published,
      questions: {
        create: questions.map((q, i) => ({
          question: q.question, options: q.options, correctIndex: q.correctIndex,
          explanation: q.explanation || null, position: i,
        })),
      },
    },
    select: { id: true },
  })
  return NextResponse.json({ id: quiz.id }, { status: 201 })
}
