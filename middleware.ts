import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin dashboard — basic auth
  if (pathname.startsWith('/dashboard')) {
    const header = request.headers.get('authorization')
    if (!header || !isValidBasicAuth(header)) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': `Basic realm="FlashGenius Dashboard"` },
      })
    }
    return NextResponse.next()
  }

  // App routes — require NextAuth session cookie
  if (pathname.startsWith('/app')) {
    const sessionToken =
      request.cookies.get('next-auth.session-token') ??
      request.cookies.get('__Secure-next-auth.session-token')
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
}

function isValidBasicAuth(header: string): boolean {
  try {
    const decoded = Buffer.from(header.replace('Basic ', ''), 'base64').toString('utf-8')
    const [user, pass] = decoded.split(':')
    return user === 'admin' && pass === (process.env.DASHBOARD_PASSWORD ?? 'flashgenius')
  } catch { return false }
}

export const config = { matcher: ['/dashboard/:path*', '/app/:path*'] }
