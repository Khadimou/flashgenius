import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
import { getSubscribers } from "@/lib/storage"

export async function GET() {
  try {
    const subs = await getSubscribers()
    subs.sort((a,b) => new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())
    return NextResponse.json({ subscribers: subs })
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
