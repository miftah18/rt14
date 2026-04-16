import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from './lib/auth'

// Routes that don't require authentication
const publicRoutes = ['/login', '/register', '/']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route) || pathname === '/')
  
  // Get session from cookie
  const session = await getSessionFromCookie()
  
  // Redirect to login if accessing protected route without session
  if (!isPublicRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Redirect to dashboard if trying to access login/register with active session
  if ((pathname === '/login' || pathname === '/register') && session) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
