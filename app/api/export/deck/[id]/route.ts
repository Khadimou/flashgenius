import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const deck = await prisma.deck.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { cards: { orderBy: { position: 'asc' } } },
  })
  if (!deck) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  const BOM = '\uFEFF'
  const rows = deck.cards.map((c) => [
    c.question.replace(/"/g, '""'),
    c.answer.replace(/"/g, '""'),
    (c.category ?? '').replace(/"/g, '""'),
  ])
  const csv = BOM + [['Question','Reponse','Categorie'], ...rows]
    .map((r) => r.map((v) => '"'+v+'"').join(',')).join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${deck.name.replace(/[^a-z0-9]/gi,'_')}.csv"`,
    },
  })
}
