import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { getSubscribers } from '@/lib/storage'
import { USE_CASE_LABELS, FREQUENCY_LABELS, DEVICE_LABELS, INTENTION_LABELS } from '@/lib/types'

export async function GET() {
  const subs = await getSubscribers()
  subs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const H = ['Email','Date inscription','Questionnaire',"Cas d'usage",'Frequence','Appareil','Intention']
  const rows = subs.map((s) => [
    s.email,
    new Date(s.createdAt).toLocaleDateString('fr-FR'),
    s.surveyCompleted ? 'Oui' : 'Non',
    s.survey ? USE_CASE_LABELS[s.survey.useCase] : '',
    s.survey ? FREQUENCY_LABELS[s.survey.frequency] : '',
    s.survey ? DEVICE_LABELS[s.survey.device] : '',
    s.survey ? INTENTION_LABELS[s.survey.intention] : '',
  ])

  const BOM = '\uFEFF'
  const csv = BOM + [H, ...rows].map((r) => r.map((c) => '"' + c + '"').join(',')).join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="flashgenius-inscrits.csv"',
    },
  })
}
