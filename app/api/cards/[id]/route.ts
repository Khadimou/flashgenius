import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const card = await prisma.card.findFirst({
    where: { id: params.id, deck: { userId: session.user.id } },
  })
  if (!card) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  const { question, answer, category, position } = await req.json()
  const updated = await prisma.card.update({
    where: { id: params.id },
    data: {
      question: question ?? card.question,
      answer: answer ?? card.answer,
      category: category !== undefined ? category : card.category,
      position: position !== undefined ? position : card.position,
    },
  })
  return NextResponse.json({ card: updated })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const card = await prisma.card.findFirst({
    where: { id: params.id, deck: { userId: session.user.id } },
  })
  if (!card) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  await prisma.card.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
