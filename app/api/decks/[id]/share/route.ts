import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const VALID_STATUSES = ['DRAFT', 'REVISION', 'EXAM']

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const userId = (session.user as { id: string }).id

  // Must be teacher
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (user?.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Seuls les enseignants peuvent partager des decks' }, { status: 403 })
  }

  // Must own the deck
  const deck = await prisma.deck.findFirst({ where: { id: params.id, userId } })
  if (!deck) return NextResponse.json({ error: 'Deck introuvable' }, { status: 404 })

  const { status } = await req.json()
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
  }

  const updated = await prisma.deck.update({
    where: { id: params.id },
    data: { shareStatus: status },
    select: { id: true, shareStatus: true },
  })

  return NextResponse.json({ deck: updated })
}
