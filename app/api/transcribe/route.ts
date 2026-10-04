import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import { toFile } from 'openai'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SUPPORTED = ['mp4', 'mp3', 'm4a', 'wav', 'webm', 'mpeg', 'mpga', 'ogg']
const MAX_SIZE = 25 * 1024 * 1024 // 25MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  // Check premium
  const user = await prisma.user.findUnique({ where: { id: (session.user as { id: string }).id } })
  if (!user?.isPremium) {
    return NextResponse.json({ error: 'Fonctionnalite premium', premium: false }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!SUPPORTED.includes(ext)) {
    return NextResponse.json({ error: `Format non supporte. Formats acceptes : ${SUPPORTED.join(', ')}` }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Fichier trop volumineux (maximum 25 MB)' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const openaiFile = await toFile(buffer, file.name, { type: file.type })

  const transcription = await openai.audio.transcriptions.create({
    file: openaiFile,
    model: 'whisper-1',
    language: 'fr',
    response_format: 'text',
  })

  return NextResponse.json({ transcript: transcription })
}
