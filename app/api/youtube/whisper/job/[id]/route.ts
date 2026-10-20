import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const SUPADATA_BASE = 'https://api.supadata.ai/v1'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'Job ID manquant' }, { status: 400 })

  const apiKey = process.env.SUPADATA_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Service non configure' }, { status: 500 })

  try {
    const res = await fetch(`${SUPADATA_BASE}/transcript/${id}`, {
      headers: { 'x-api-key': apiKey },
    })

    if (res.status === 404) {
      return NextResponse.json({ error: 'Job expire ou introuvable' }, { status: 404 })
    }

    if (!res.ok) {
      const errText = await res.text()
      console.error('supadata job error:', res.status, errText)
      return NextResponse.json({ error: 'Erreur service transcription' }, { status: 500 })
    }

    const data = await res.json()

    if (data.status === 'completed') {
      const transcript = (data.content || '').trim()
      if (transcript.length < 50) {
        return NextResponse.json({ status: 'failed', error: 'Transcription trop courte.' })
      }
      return NextResponse.json({ status: 'completed', transcript, length: transcript.length })
    }

    if (data.status === 'failed') {
      return NextResponse.json({ status: 'failed', error: data.error || 'Transcription echouee' })
    }

    return NextResponse.json({ status: data.status })
  } catch (err) {
    console.error('job poll:', err)
    return NextResponse.json({ error: 'Connexion impossible' }, { status: 500 })
  }
}
