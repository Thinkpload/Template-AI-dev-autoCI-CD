import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/dashboard'];
const AUTH_PATHS = ['/sign-in', '/sign-up'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('better-auth.session_token');

  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p)) && !sessionToken) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  if (AUTH_PATHS.includes(pathname) && sessionToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
