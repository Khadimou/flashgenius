import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const deck = await prisma.deck.findFirst({ where: { id: params.id, userId: session.user.id } })
  if (!deck) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  const { question, answer, category, position } = await req.json()
  const card = await prisma.card.create({
    data: { deckId: params.id, question, answer, category: category || null, position: position ?? 0 },
  })
  return NextResponse.json({ card }, { status: 201 })
}
