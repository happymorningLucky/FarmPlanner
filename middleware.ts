import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Simple check for NextAuth session token
  const token = request.cookies.get('next-auth.session-token') || request.cookies.get('__Secure-next-auth.session-token')
  const { pathname } = request.nextUrl

  if (!token && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/planner', request.url))
  }

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/planner', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
