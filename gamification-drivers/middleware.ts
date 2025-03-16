import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;

  // Allow only specific routes
  const allowedRoutes = [
    '/', 
    '/dashboard', 
    '/driver', 
    '/passenger',
    '/profile',
    '/coins',
    '/leaderboard'
  ];
  
  // Check if the current path is in the allowed routes
  const isAllowedRoute = allowedRoutes.some(route => 
    pathname === route || 
    pathname.startsWith(`${route}/`) ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') // Allow static files
  );

  // If not an allowed route, redirect to home page
  if (!isAllowedRoute) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
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
};