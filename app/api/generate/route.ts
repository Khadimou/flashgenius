import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateFlashcards } from '@/lib/openai'

export const dynamic = 'force-dynamic'

// Free tier: 10 generations per calendar month
const FREE_MONTHLY_LIMIT = 10

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const userId = (session.user as { id: string }).id

  // Fetch user and check/reset monthly counter
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPremium: true, generationsCount: true, generationsResetAt: true },
  })
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  const now = new Date()
  const monthStart = startOfMonth(now)
  const needsReset = user.generationsResetAt < monthStart

  const currentCount = needsReset ? 0 : user.generationsCount

  // Block free users over limit (premium = unlimited)
  if (!user.isPremium && currentCount >= FREE_MONTHLY_LIMIT) {
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return NextResponse.json({
      error: `Limite atteinte — ${FREE_MONTHLY_LIMIT} generations gratuites par mois. Renouvellement le ${nextReset.toLocaleDateString('fr-FR')}.`,
      limitReached: true,
      limit: FREE_MONTHLY_LIMIT,
      used: currentCount,
      resetAt: nextReset.toISOString(),
    }, { status: 429 })
  }

  try {
    const { text } = await req.json()
    if (!text || text.trim().length < 20) {
      return NextResponse.json({ error: 'Texte trop court (minimum 20 caracteres)' }, { status: 400 })
    }
    if (text.length > 30000) {
      return NextResponse.json({ error: 'Texte trop long (maximum 30 000 caracteres)' }, { status: 400 })
    }

    const cards = await generateFlashcards(text.trim())

    // Increment counter (reset if new month)
    await prisma.user.update({
      where: { id: userId },
      data: {
        generationsCount: needsReset ? 1 : { increment: 1 },
        ...(needsReset ? { generationsResetAt: now } : {}),
      },
    })

    return NextResponse.json({
      cards,
      usage: {
        used: currentCount + 1,
        limit: user.isPremium ? null : FREE_MONTHLY_LIMIT,
        isPremium: user.isPremium,
      },
    })
  } catch (e) {
    console.error('generate:', e)
    return NextResponse.json({ error: 'Erreur lors de la generation' }, { status: 500 })
  }
}
