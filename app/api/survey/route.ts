import { NextRequest, NextResponse } from 'next/server'
import { updateSubscriber, getSubscribers } from '@/lib/storage'
import { sendWelcomeEmail } from '@/lib/mailer'
import type { SurveyData } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { id, useCase, frequency, device, intention } = await req.json()
    if (!id || !useCase || !frequency || !device || !intention)
      return NextResponse.json({ error: 'Donnees manquantes' }, { status: 400 })

    const survey: SurveyData = { useCase, frequency, device, intention, submittedAt: new Date().toISOString() }
    await updateSubscriber(id, { surveyCompleted: true, survey })

    // Get subscriber email and send welcome email
    const subscribers = await getSubscribers()
    const subscriber = subscribers.find((s) => s.id === id)
    if (subscriber?.email) {
      await sendWelcomeEmail(subscriber.email)
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('survey:', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
