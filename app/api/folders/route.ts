import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const folders = await prisma.folder.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { decks: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ folders })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })

  const folder = await prisma.folder.create({
    data: { name: name.trim(), userId: session.user.id },
  })
  return NextResponse.json({ folder }, { status: 201 })
}
