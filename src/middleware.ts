import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/schemas',
  '/extractions',
  '/data-library',
  '/analytics',
  '/settings',
  '/profile',
  '/admin'
]

// Routes that should redirect authenticated users away (auth pages)
const authRoutes = [
  '/login',
  '/signup',
  '/signup/form',
  '/signup/otp', 
  '/verify-otp',
  '/forgot-password',
  '/reset-password'
]

// Public routes that don't require authentication
const publicRoutes = [
  '/unauthorized'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get token from cookies or headers
  const token = request.cookies.get('auth_token')?.value ||
               request.headers.get('authorization')?.replace('Bearer ', '')

  const isAuthenticated = !!token

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
  
  // Check if the route is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  )

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  // Handle protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('returnUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Handle auth routes - redirect authenticated users away
  if (isAuthRoute && isAuthenticated) {
    const returnUrl = request.nextUrl.searchParams.get('returnUrl') || '/dashboard'
    return NextResponse.redirect(new URL(returnUrl, request.url))
  }

  // Handle root route redirect
  if (pathname === '/' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Allow access to public routes and other routes
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
