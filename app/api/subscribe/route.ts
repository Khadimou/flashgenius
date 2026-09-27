import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { addSubscriber, emailExists } from "@/lib/storage"
import type { Subscriber } from "@/lib/types"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !email.includes("@"))
      return NextResponse.json({ error: "Email invalide" }, { status: 400 })
    const normalized = email.toLowerCase().trim()
    if (await emailExists(normalized))
      return NextResponse.json({ error: "Deja inscrit", alreadyExists: true }, { status: 409 })
    const sub: Subscriber = {
      id: uuidv4(), email: normalized,
      createdAt: new Date().toISOString(), surveyCompleted: false,
    }
    await addSubscriber(sub)
    return NextResponse.json({ success: true, id: sub.id })
  } catch (e) {
    console.error("subscribe:", e)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
