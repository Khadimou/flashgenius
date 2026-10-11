import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const userId = (session.user as { id: string }).id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (user?.role === 'TEACHER') {
    // Teacher: return own shared decks
    const decks = await prisma.deck.findMany({
      where: { userId, shareStatus: { not: 'DRAFT' } },
      include: {
        _count: { select: { cards: true, enrollments: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json({ role: 'TEACHER', decks })
  }

  // Student: return enrolled courses
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: userId },
    include: {
      deck: {
        select: {
          id: true,
          name: true,
          shareStatus: true,
          _count: { select: { cards: true } },
          user: { select: { name: true, email: true, subject: true, slug: true } },
        },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  })
  return NextResponse.json({ role: 'STUDENT', enrollments })
}
