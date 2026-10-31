import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.id },
    include: { questions: { orderBy: { position: 'asc' } } },
  })
  if (!quiz || (!quiz.published && quiz.userId !== userId)) {
    return NextResponse.json({ error: 'QCM introuvable' }, { status: 404 })
  }

  const { answers } = await req.json()
  if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
    return NextResponse.json({ error: 'Reponses invalides' }, { status: 400 })
  }
  const chosen = answers.map((a: unknown) => (Number.isInteger(a) ? (a as number) : -1))

  const corrections = quiz.questions.map((q, i) => ({
    questionId: q.id,
    chosen: chosen[i],
    correctIndex: q.correctIndex,
    isCorrect: chosen[i] === q.correctIndex,
    explanation: q.explanation ?? '',
  }))
  const score = corrections.filter((c) => c.isCorrect).length

  // Teacher previews are not recorded in the stats
  if (quiz.userId !== userId) {
    await prisma.quizAttempt.create({
      data: { quizId: quiz.id, studentId: userId, score, total: corrections.length, answers: chosen },
    })
  }

  return NextResponse.json({ score, total: corrections.length, corrections })
}
