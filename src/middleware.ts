import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname 
  const isPublicPath = path === '/login' || path === '/signin' || path === '/verified' || path === '/changepassword'
  
  const token = request.cookies.get('token')?.value || ""
  
  // For public paths
  if (isPublicPath) {
    if (token) {
      try {
        // Verify token
        const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET!);
        // Only redirect if token is valid
        return NextResponse.redirect(new URL('/', request.nextUrl));
      } catch (error) {
        // If token is invalid, allow access to public paths
        return NextResponse.next();
      }
    }
    // No token, allow access to public paths
    return NextResponse.next();
  }

  // For protected paths
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  // Allow access to protected paths if token exists
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/signin',
    '/login',
    '/admin/:path*',
    '/verified',
    '/changepassword',
  ],
}