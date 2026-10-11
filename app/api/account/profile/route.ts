import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const userId = (session.user as { id: string }).id
  const { name, bio, subject, slug } = await req.json()

  // Validate slug uniqueness if changed
  if (slug) {
    const clean = slug.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-|-$/g, '')
    if (clean.length < 2) return NextResponse.json({ error: 'Slug trop court (minimum 2 caracteres)' }, { status: 400 })
    const exists = await prisma.user.findFirst({ where: { slug: clean, NOT: { id: userId } } })
    if (exists) return NextResponse.json({ error: 'Ce slug est deja utilise' }, { status: 409 })

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined ? { name: name.trim() || null } : {}),
        ...(bio !== undefined ? { bio: bio.trim() || null } : {}),
        ...(subject !== undefined ? { subject: subject.trim() || null } : {}),
        slug: clean,
      },
      select: { name: true, bio: true, subject: true, slug: true },
    })
    return NextResponse.json(updated)
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined ? { name: name.trim() || null } : {}),
      ...(bio !== undefined ? { bio: bio.trim() || null } : {}),
      ...(subject !== undefined ? { subject: subject.trim() || null } : {}),
    },
    select: { name: true, bio: true, subject: true, slug: true },
  })
  return NextResponse.json(updated)
}
