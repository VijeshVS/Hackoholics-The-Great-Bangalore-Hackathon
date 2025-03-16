import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token');
  const isPublicPath = request.nextUrl.pathname === '/';

  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
}

export const config = {
  matcher: ['/', '/dashboard/:path*']
};
