import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { YoutubeTranscript } from 'youtube-transcript'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function extractVideoId(input: string): string | null {
  // Handles: youtu.be/ID, youtube.com/watch?v=ID, youtube.com/shorts/ID, bare ID
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

  const { url } = await req.json()
  if (!url?.trim()) return NextResponse.json({ error: 'URL manquante' }, { status: 400 })

  const videoId = extractVideoId(url.trim())
  if (!videoId) {
    return NextResponse.json({ error: 'URL YouTube invalide' }, { status: 400 })
  }

  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'fr' })
      .catch(() => YoutubeTranscript.fetchTranscript(videoId))

    if (!segments?.length) {
      return NextResponse.json({
        error: 'Aucun sous-titre disponible pour cette video. Essaie avec une video qui a des sous-titres automatiques ou manuels.',
      }, { status: 422 })
    }

    // Join segments, clean HTML entities and extra whitespace
    const transcript = segments
      .map((s) => s.text.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim())
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (transcript.length < 50) {
      return NextResponse.json({ error: 'Transcription trop courte pour generer des flashcards.' }, { status: 422 })
    }

    return NextResponse.json({ transcript, videoId, length: transcript.length })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('disabled') || msg.includes('no transcript')) {
      return NextResponse.json({
        error: "Les sous-titres sont desactives sur cette video. Essaie une autre video ou utilise l'import audio/video (Premium).",
      }, { status: 422 })
    }
    console.error('youtube-transcript:', err)
    return NextResponse.json({ error: "Impossible de recuperer les sous-titres. Verifie l'URL et reessaie." }, { status: 500 })
  }
}
