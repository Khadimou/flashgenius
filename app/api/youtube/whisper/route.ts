import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SUPADATA_BASE = 'https://api.supadata.ai/v1'

function extractVideoId(input: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/,
    /^([\w-]{11})$/,
  ]
  for (const re of patterns) {
    const m = input.trim().match(re)
    if (m) return m[1]
  }
  return null
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: (session.user as { id: string }).id } })
  if (!user?.isPremium) {
    return NextResponse.json({ error: 'Fonctionnalite premium', premium: false }, { status: 403 })
  }

  const apiKey = process.env.SUPADATA_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Service de transcription non configure' }, { status: 500 })
  }

  const { url } = await req.json()
  if (!url?.trim()) return NextResponse.json({ error: 'URL manquante' }, { status: 400 })

  const videoId = extractVideoId(url.trim())
  if (!videoId) {
    return NextResponse.json({ error: 'URL YouTube invalide' }, { status: 400 })
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
  const params = new URLSearchParams({
    url: videoUrl,
    lang: 'fr',
    text: 'true',
    mode: 'generate',
  })

  try {
    const res = await fetch(`${SUPADATA_BASE}/transcript?${params}`, {
      headers: { 'x-api-key': apiKey },
    })

    if (res.status === 202) {
      const data = await res.json()
      return NextResponse.json({ jobId: data.jobId, status: 'queued' })
    }

    if (!res.ok) {
      const errText = await res.text()
      console.error('supadata error:', res.status, errText)
      if (res.status === 403) {
        return NextResponse.json({ error: 'Video restreinte ou privee.' }, { status: 422 })
      }
      if (res.status === 404) {
        return NextResponse.json({ error: 'Video introuvable.' }, { status: 422 })
      }
      if (res.status === 429) {
        return NextResponse.json({ error: 'Quota Supadata atteint. Reessaie plus tard.' }, { status: 429 })
      }
      return NextResponse.json({ error: 'Erreur du service de transcription.' }, { status: 500 })
    }

    const data = await res.json()
    const transcript = (data.content || '').trim()
    if (transcript.length < 50) {
      return NextResponse.json({ error: 'Transcription trop courte pour generer des flashcards.' }, { status: 422 })
    }

    return NextResponse.json({ transcript, videoId, length: transcript.length })
  } catch (err: unknown) {
    console.error('youtube-whisper:', err)
    return NextResponse.json({ error: 'Impossible de transcrire cette video.' }, { status: 500 })
  }
}
