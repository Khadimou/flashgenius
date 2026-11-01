import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { toSlug } from '@/lib/slug'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const role = body.role === 'TEACHER' ? 'TEACHER' : body.role === 'STUDENT' ? 'STUDENT' : null

  if (!name) return NextResponse.json({ error: 'Indique ton nom' }, { status: 400 })
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
  if (password.length < 8 || password.length > 128) return NextResponse.json({ error: 'Mot de passe : 8 caracteres minimum' }, { status: 400 })
  if (!role) return NextResponse.json({ error: 'Choisis : eleve ou enseignant' }, { status: 400 })

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) {
    return NextResponse.json({ error: 'Un compte existe deja avec cet email. Connecte-toi ou reinitialise ton mot de passe.' }, { status: 409 })
  }

  let slug: string | null = null
  if (role === 'TEACHER') {
    const base = toSlug(name) || 'prof'
    slug = base
    for (let i = 1; i <= 20 && (await prisma.user.findUnique({ where: { slug } })); i++) slug = `${base}-${i}`
  }

  try {
    await prisma.user.create({
      data: { name, email, password: await bcrypt.hash(password, 12), role, slug },
    })
  } catch {
    return NextResponse.json({ error: 'Creation impossible, reessaie' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
