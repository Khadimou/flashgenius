import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function ownDeck(userId: string, id: string) {
  return prisma.deck.findFirst({ where: { id, userId } })
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const deck = await prisma.deck.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      folder: true,
      cards: { orderBy: { position: 'asc' } },
    },
  })
  if (!deck) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json({ deck })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const existing = await ownDeck(session.user.id, params.id)
  if (!existing) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  const { name, folderId } = await req.json()
  const deck = await prisma.deck.update({
    where: { id: params.id },
    data: {
      name: name?.trim() ?? existing.name,
      folderId: folderId !== undefined ? (folderId || null) : existing.folderId,
    },
  })
  return NextResponse.json({ deck })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const existing = await ownDeck(session.user.id, params.id)
  if (!existing) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  await prisma.deck.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
