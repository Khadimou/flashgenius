import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import EmailProvider from 'next-auth/providers/email'
import nodemailer from 'nodemailer'
import { prisma } from './prisma'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM ?? 'FlashGenius <noreply@gmail.com>',
      async sendVerificationRequest({ identifier: email, url }) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`\n[Magic Link] ${email}\n${url}\n`)
          return
        }
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: email,
          subject: 'Connexion a FlashGenius',
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;background:#050510;color:#fff;border-radius:16px">
              <div style="font-size:24px;font-weight:900;color:#a78bfa;margin-bottom:8px">⚡ FlashGenius</div>
              <p style="color:#d1d5db;margin-bottom:24px">Clique sur le lien ci-dessous pour te connecter :</p>
              <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">
                Me connecter &rarr;
              </a>
              <p style="color:#6b7280;font-size:12px;margin-top:24px">
                Ce lien expire dans 24h. Si tu n'as pas demande cette connexion, ignore cet email.
              </p>
            </div>
          `,
        })
      },
    }),
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/login?verify=1',
    error: '/login?error=1',
  },
  session: { strategy: 'database' },
  callbacks: {
    session({ session, user }) {
      if (session.user) (session.user as { id?: string }).id = user.id
      return session
    },
  },
}
