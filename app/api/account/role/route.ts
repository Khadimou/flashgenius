import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const userId = (session.user as { id: string }).id
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  if (user.role === 'TEACHER') {
    return NextResponse.json({ message: 'Deja enseignant', role: 'TEACHER' })
  }

  // Generate unique slug from name or email
  const base = toSlug(user.name ?? user.email?.split('@')[0] ?? 'prof')
  let slug = base
  let tries = 0
  while (tries < 10) {
    const exists = await prisma.user.findUnique({ where: { slug } })
    if (!exists || exists.id === userId) break
    tries++
    slug = `${base}-${tries}`
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: 'TEACHER', slug },
    select: { role: true, slug: true },
  })

  return NextResponse.json(updated)
}
