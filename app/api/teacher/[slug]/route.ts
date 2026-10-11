import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: { slug: string } }) {
  const teacher = await prisma.user.findUnique({
    where: { slug: params.slug, role: 'TEACHER' },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      subject: true,
      slug: true,
      decks: {
        where: { shareStatus: 'REVISION' },
        select: {
          id: true,
          name: true,
          shareStatus: true,
          createdAt: true,
          _count: { select: { cards: true, enrollments: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!teacher) return NextResponse.json({ error: 'Enseignant introuvable' }, { status: 404 })
  return NextResponse.json({ teacher })
}
