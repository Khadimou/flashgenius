import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Public: get deck info for join page (no auth required)
export async function GET(_: NextRequest, { params }: { params: { deckId: string } }) {
  const deck = await prisma.deck.findFirst({
    where: { id: params.deckId, shareStatus: 'REVISION' },
    select: {
      id: true,
      name: true,
      shareStatus: true,
      _count: { select: { cards: true } },
      user: { select: { name: true, email: true, subject: true, slug: true } },
    },
  })
  if (!deck) return NextResponse.json({ error: 'Cours introuvable ou non disponible' }, { status: 404 })
  return NextResponse.json({ deck })
}

// Authenticated: enroll in course
export async function POST(_: NextRequest, { params }: { params: { deckId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Connexion requise' }, { status: 401 })

  const studentId = (session.user as { id: string }).id

  const deck = await prisma.deck.findFirst({
    where: { id: params.deckId, shareStatus: 'REVISION' },
  })
  if (!deck) return NextResponse.json({ error: 'Cours introuvable ou non disponible' }, { status: 404 })

  // Can't enroll in own deck
  if (deck.userId === studentId) {
    return NextResponse.json({ error: 'Vous ne pouvez pas vous inscrire a votre propre cours' }, { status: 400 })
  }

  // Upsert (idempotent)
  const enrollment = await prisma.enrollment.upsert({
    where: { studentId_deckId: { studentId, deckId: params.deckId } },
    create: { studentId, deckId: params.deckId },
    update: {},
  })

  return NextResponse.json({ enrollment })
}
