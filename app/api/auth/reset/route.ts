import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const token = typeof body.token === 'string' ? body.token : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (password.length < 8 || password.length > 128) return NextResponse.json({ error: 'Mot de passe : 8 caracteres minimum' }, { status: 400 })

  const bad = NextResponse.json({ error: 'Lien invalide ou expire. Demande un nouveau lien.' }, { status: 400 })
  if (!email || !token) return bad

  const hashed = crypto.createHash('sha256').update(token).digest('hex')
  const rec = await prisma.verificationToken.findFirst({ where: { identifier: 'reset:' + email, token: hashed } })
  if (!rec || rec.expires < new Date()) return bad

  const res = await prisma.user.updateMany({ where: { email }, data: { password: await bcrypt.hash(password, 12) } })
  await prisma.verificationToken.deleteMany({ where: { identifier: 'reset:' + email } })
  if (res.count === 0) return bad
  return NextResponse.json({ ok: true })
}
