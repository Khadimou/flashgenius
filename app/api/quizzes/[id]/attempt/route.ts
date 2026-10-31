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

  // Each answer = array of selected option indexes (a bare number is accepted for single answers)
  const chosen: number[][] = answers.map((a: unknown, i: number) => {
    const nOpts = (quiz.questions[i].options as string[]).length
    const arr = Array.isArray(a) ? a : Number.isInteger(a) && (a as number) >= 0 ? [a] : []
    return Array.from(new Set(arr.filter((n: unknown): n is number => Number.isInteger(n) && (n as number) >= 0 && (n as number) < nOpts))).sort((x, y) => x - y)
  })

  const corrections = quiz.questions.map((q, i) => {
    const correctIndices = Array.isArray(q.correctIndices) && q.correctIndices.length
      ? (q.correctIndices as number[]) : [q.correctIndex]
    const good = [...correctIndices].sort((x, y) => x - y)
    return {
      questionId: q.id,
      chosen: chosen[i],
      correctIndices: good,
      // all-or-nothing: exactly the right set
      isCorrect: chosen[i].length === good.length && chosen[i].every((v, k) => v === good[k]),
      explanation: q.explanation ?? '',
      optionExplanations: Array.isArray(q.optionExplanations) ? (q.optionExplanations as string[]) : [],
    }
  })
  const score = corrections.filter((c) => c.isCorrect).length

  // Teacher previews are not recorded in the stats
  if (quiz.userId !== userId) {
    await prisma.quizAttempt.create({
      data: { quizId: quiz.id, studentId: userId, score, total: corrections.length, answers: chosen },
    })
  }

  return NextResponse.json({ score, total: corrections.length, corrections })
}
