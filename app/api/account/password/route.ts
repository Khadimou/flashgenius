import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Non autorise" }, { status: 401 })

  const { password, currentPassword } = await req.json()
  if (!password || password.length < 8)
    return NextResponse.json({ error: "Mot de passe trop court (minimum 8 caracteres)" }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: (session.user as { id: string }).id } })
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })

  if (user.password) {
    if (!currentPassword) return NextResponse.json({ error: "Mot de passe actuel requis" }, { status: 400 })
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 12)
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })

  return NextResponse.json({ success: true })
}
