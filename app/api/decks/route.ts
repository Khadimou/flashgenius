import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const decks = await prisma.deck.findMany({
    where: { userId: session.user.id },
    include: {
      folder: { select: { id: true, name: true } },
      _count: { select: { cards: true } },
      cards: { select: { dueDate: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json({ decks })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const { name, folderId, cards } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })

  const deck = await prisma.deck.create({
    data: {
      name: name.trim(),
      userId: session.user.id,
      folderId: folderId || null,
      cards: cards?.length
        ? { create: cards.map((c: { question: string; answer: string; category?: string }, i: number) => ({
            question: c.question,
            answer: c.answer,
            category: c.category ?? null,
            position: i,
          })) }
        : undefined,
    },
    include: { _count: { select: { cards: true } } },
  })

  return NextResponse.json({ deck }, { status: 201 })
}
