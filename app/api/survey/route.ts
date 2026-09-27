import { NextRequest, NextResponse } from "next/server"
import { updateSubscriber } from "@/lib/storage"
import type { SurveyData } from "@/lib/types"

export async function POST(req: NextRequest) {
  try {
    const { id, useCase, frequency, device, intention } = await req.json()
    if (!id||!useCase||!frequency||!device||!intention)
      return NextResponse.json({ error: "Donnees manquantes" }, { status: 400 })
    const survey: SurveyData = { useCase, frequency, device, intention, submittedAt: new Date().toISOString() }
    await updateSubscriber(id, { surveyCompleted: true, survey })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("survey:", e)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
