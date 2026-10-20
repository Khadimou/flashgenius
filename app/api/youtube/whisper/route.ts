import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ytdl from '@distube/ytdl-core'
import OpenAI from 'openai'
import { toFile } from 'openai'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const MAX_SIZE = 25 * 1024 * 1024
const MAX_DURATION_SEC = 15 * 60

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

  const { url } = await req.json()
  if (!url?.trim()) return NextResponse.json({ error: 'URL manquante' }, { status: 400 })

  const videoId = extractVideoId(url.trim())
  if (!videoId) {
    return NextResponse.json({ error: 'URL YouTube invalide' }, { status: 400 })
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`

  try {
    const info = await ytdl.getInfo(videoUrl)
    const lengthSec = parseInt(info.videoDetails.lengthSeconds, 10) || 0

    if (lengthSec > MAX_DURATION_SEC) {
      return NextResponse.json({
        error: `Video trop longue (${Math.round(lengthSec / 60)} min). Maximum 15 min pour la transcription Whisper.`,
      }, { status: 422 })
    }

    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly')
    if (!audioFormats.length) {
      return NextResponse.json({ error: 'Aucun flux audio disponible pour cette video.' }, { status: 422 })
    }
    const format = audioFormats.sort((a, b) => (a.bitrate || 0) - (b.bitrate || 0))[0]

    const chunks: Buffer[] = []
    let total = 0
    const stream = ytdl.downloadFromInfo(info, { format })

    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => {
        total += chunk.length
        if (total > MAX_SIZE) {
          stream.destroy()
          reject(new Error('TOO_LARGE'))
          return
        }
        chunks.push(chunk)
      })
      stream.on('end', () => resolve())
      stream.on('error', (e) => reject(e))
    })

    const buffer = Buffer.concat(chunks)
    const ext = format.container || 'm4a'
    const mime = format.mimeType?.split(';')[0] || 'audio/mp4'
    const openaiFile = await toFile(buffer, `youtube.${ext}`, { type: mime })

    const transcription = await openai.audio.transcriptions.create({
      file: openaiFile,
      model: 'whisper-1',
      language: 'fr',
      response_format: 'text',
    })

    const transcript = String(transcription).trim()
    if (transcript.length < 50) {
      return NextResponse.json({ error: 'Transcription trop courte pour generer des flashcards.' }, { status: 422 })
    }

    return NextResponse.json({ transcript, videoId, length: transcript.length, title: info.videoDetails.title })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg === 'TOO_LARGE') {
      return NextResponse.json({ error: 'Audio trop volumineux (>25 MB). Essaie une video plus courte.' }, { status: 422 })
    }
    console.error('youtube-whisper:', err)
    return NextResponse.json({ error: "Impossible de telecharger l'audio de cette video. Elle est peut-etre privee ou restreinte." }, { status: 500 })
  }
}
