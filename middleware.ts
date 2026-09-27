import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    const header = request.headers.get("authorization")
    if (!header || !isValidAuth(header)) {
      return new NextResponse("Unauthorized", {
        status: 401,
        headers: { "WWW-Authenticate": `Basic realm="FlashGenius Dashboard"` },
      })
    }
  }
}

function isValidAuth(header: string): boolean {
  try {
    const decoded = Buffer.from(header.replace("Basic ",""),"base64").toString("utf-8")
    const [user,pass] = decoded.split(":")
    return user === "admin" && pass === (process.env.DASHBOARD_PASSWORD ?? "flashgenius")
  } catch { return false }
}

export const config = { matcher: ["/dashboard/:path*"] }
