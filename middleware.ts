import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /{locale}/dashboard routes
  if (/^\/(fr|en)\/dashboard(\/.*)?$/.test(pathname)) {
    const token = request.cookies.get('auth_token');
    if (!token?.value) {
      const locale = pathname.startsWith('/en/') ? 'en' : 'fr';
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
