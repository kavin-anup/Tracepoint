import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  
  // Redirect www.tracepoint.vercel.app to tracepoint.vercel.app
  if (hostname === 'www.tracepoint.vercel.app') {
    const url = request.nextUrl.clone()
    url.host = 'tracepoint.vercel.app'
    url.protocol = 'https:'
    return NextResponse.redirect(url, 301)
  }
  
  // Force HTTPS (Vercel handles this, but adding for extra security)
  if (request.headers.get('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    const url = request.nextUrl.clone()
    url.protocol = 'https:'
    return NextResponse.redirect(url, 301)
  }
  
  // Create response
  const response = NextResponse.next()
  
  // Security Headers
  const securityHeaders = {
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Prevent clickjacking attacks
    'X-Frame-Options': 'DENY',
    
    // Enable XSS protection (legacy, but still useful)
    'X-XSS-Protection': '1; mode=block',
    
    // Strict Transport Security (HSTS) - force HTTPS
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // Content Security Policy - restrict resource loading
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // 'unsafe-eval' needed for Next.js
      "style-src 'self' 'unsafe-inline'", // 'unsafe-inline' needed for Tailwind
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://*.supabase.in",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-src 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests"
    ].join('; '),
    
    // Referrer Policy - control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions Policy - restrict browser features
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()'
    ].join(', '),
  }
  
  // Add security headers to response
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

