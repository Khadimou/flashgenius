import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sm2 } from '@/lib/sm2'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { cardId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const card = await prisma.card.findFirst({
    where: { id: params.cardId, deck: { userId: session.user.id } },
  })
  if (!card) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  const { quality } = await req.json() as { quality: 0|1|2|3|4|5 }
  if (quality < 0 || quality > 5) {
    return NextResponse.json({ error: 'Qualite invalide (0-5)' }, { status: 400 })
  }

  const result = sm2(quality, card.easeFactor, card.interval, card.repetitions)

  const updated = await prisma.card.update({
    where: { id: params.cardId },
    data: result,
  })

  return NextResponse.json({ card: updated })
}
