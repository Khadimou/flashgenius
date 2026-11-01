import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Teachers who have published at least one course or one QCM. Emails are never exposed.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const teachers = await prisma.user.findMany({
    where: {
      role: 'TEACHER',
      slug: { not: null },
      OR: [{ decks: { some: { shareStatus: 'REVISION' } } }, { quizzes: { some: { published: true } } }],
    },
    select: {
      name: true, email: true, bio: true, subject: true, slug: true,
      decks: { where: { shareStatus: 'REVISION' }, select: { id: true } },
      quizzes: { where: { published: true }, select: { id: true } },
    },
    orderBy: { name: 'asc' },
    take: 200,
  })

  return NextResponse.json({
    teachers: teachers.map((t) => ({
      name: t.name ?? t.email?.split('@')[0] ?? 'Enseignant',
      bio: t.bio, subject: t.subject, slug: t.slug,
      courses: t.decks.length, quizzes: t.quizzes.length,
    })),
  })
}
