import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/mailer'

export const dynamic = 'force-dynamic'

const hashToken = (t: string) => crypto.createHash('sha256').update(t).digest('hex')

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  // Same answer whether the account exists or not (no account enumeration)
  const ok = NextResponse.json({ ok: true })
  if (!email) return ok

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (!user) return ok

  const identifier = 'reset:' + email
  const token = crypto.randomBytes(32).toString('hex')
  await prisma.verificationToken.deleteMany({ where: { identifier } })
  await prisma.verificationToken.create({
    data: { identifier, token: hashToken(token), expires: new Date(Date.now() + 60 * 60 * 1000) },
  })

  const base = process.env.NEXTAUTH_URL ?? req.nextUrl.origin
  const url = `${base}/reset-password?token=${token}&email=${encodeURIComponent(email)}`
  try {
    await sendPasswordResetEmail(email, url)
  } catch (e) {
    console.error('password reset mail:', e)
  }
  return ok
}
