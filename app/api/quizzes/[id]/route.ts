import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeQuestions } from '@/lib/quiz'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.id },
    include: {
      questions: { orderBy: { position: 'asc' } },
      deck: { select: { id: true, name: true } },
      user: { select: { name: true, email: true } },
    },
  })
  if (!quiz) return NextResponse.json({ error: 'QCM introuvable' }, { status: 404 })

  if (quiz.userId === userId) {
    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId: quiz.id },
      orderBy: { createdAt: 'desc' },
      include: { student: { select: { name: true, email: true } } },
    })
    const n = quiz.questions.length
    const comparable = attempts.filter((a) => Array.isArray(a.answers) && (a.answers as unknown[]).length === n)
    const perQuestion = quiz.questions.map((q, i) => ({
      questionId: q.id,
      percentCorrect: comparable.length
        ? Math.round((comparable.filter((a) => (a.answers as number[])[i] === q.correctIndex).length / comparable.length) * 100)
        : null,
    }))
    return NextResponse.json({
      isOwner: true,
      quiz: {
        id: quiz.id, title: quiz.title, published: quiz.published, deck: quiz.deck,
        questions: quiz.questions.map((q) => ({
          id: q.id, question: q.question, options: q.options as string[],
          correctIndex: q.correctIndex, explanation: q.explanation ?? '',
        })),
      },
      attempts: attempts.map((a) => ({
        id: a.id, score: a.score, total: a.total, createdAt: a.createdAt,
        student: a.student.name ?? a.student.email ?? 'Anonyme',
      })),
      perQuestion,
    })
  }

  if (!quiz.published) return NextResponse.json({ error: 'QCM introuvable' }, { status: 404 })

  const mine = await prisma.quizAttempt.findMany({
    where: { quizId: quiz.id, studentId: userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { score: true, total: true, createdAt: true },
  })
  return NextResponse.json({
    isOwner: false,
    quiz: {
      id: quiz.id, title: quiz.title, teacher: quiz.user.name ?? quiz.user.email,
      deckName: quiz.deck?.name ?? null,
      questions: quiz.questions.map((q) => ({ id: q.id, question: q.question, options: q.options as string[] })),
    },
    myAttempts: mine,
  })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const quiz = await prisma.quiz.findFirst({ where: { id: params.id, userId }, select: { id: true } })
  if (!quiz) return NextResponse.json({ error: 'QCM introuvable' }, { status: 404 })

  const body = await req.json()
  const data: { title?: string; published?: boolean; deckId?: string | null } = {}
  if (typeof body.title === 'string') {
    if (!body.title.trim()) return NextResponse.json({ error: 'Titre requis' }, { status: 400 })
    data.title = body.title.trim()
  }
  if (typeof body.published === 'boolean') data.published = body.published
  if ('deckId' in body) {
    if (body.deckId) {
      const deck = await prisma.deck.findFirst({ where: { id: body.deckId, userId }, select: { id: true } })
      if (!deck) return NextResponse.json({ error: 'Cours introuvable' }, { status: 404 })
      data.deckId = deck.id
    } else data.deckId = null
  }

  let questions = null
  if (body.questions !== undefined) {
    questions = sanitizeQuestions(body.questions)
    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'Questions invalides' }, { status: 400 })
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.quiz.update({ where: { id: quiz.id }, data })
    if (questions) {
      await tx.quizQuestion.deleteMany({ where: { quizId: quiz.id } })
      await tx.quizQuestion.createMany({
        data: questions.map((q, i) => ({
          quizId: quiz.id, question: q.question, options: q.options,
          correctIndex: q.correctIndex, explanation: q.explanation || null, position: i,
        })),
      })
    }
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const res = await prisma.quiz.deleteMany({ where: { id: params.id, userId } })
  if (res.count === 0) return NextResponse.json({ error: 'QCM introuvable' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
