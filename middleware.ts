import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { verifySessionToken } from './lib/admin-session';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const lowerPathname = pathname.toLowerCase();

  // Protect all /{locale}/dashboard routes (B2B merchant).
  // Matched on the lowercased path so /fr/DASHBOARD can't bypass the check.
  if (/^\/(fr|en)\/dashboard(\/.*)?$/.test(lowerPathname)) {
    const token = request.cookies.get('auth_token');
    if (!token?.value) {
      const locale = lowerPathname.startsWith('/en/') ? 'en' : 'fr';
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }
  }

  // Protect /{locale}/dashboard/admin routes — require admin_session cookie
  // The login page itself is excluded so the user can authenticate
  if (/^\/(fr|en)\/dashboard\/admin(\/(?!login).*)?$/.test(lowerPathname)) {
    const adminSession = request.cookies.get('admin_session');
    if (!(await verifySessionToken(adminSession?.value))) {
      const locale = lowerPathname.startsWith('/en/') ? 'en' : 'fr';
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/dashboard/admin/login`;
      return NextResponse.redirect(url);
    }
  }

  // Normalize case: Next.js/Vercel matches routes case-insensitively, so
  // /fr/PRICING serves the same page as /fr/pricing — a duplicate-content
  // vector without a canonical. 308 to the lowercase path instead.
  // Dashboard paths are excluded: they can carry case-sensitive IDs.
  if (pathname !== lowerPathname && !/^\/(fr|en)\/dashboard(\/|$)/.test(lowerPathname)) {
    const url = request.nextUrl.clone();
    url.pathname = lowerPathname;
    return NextResponse.redirect(url, 308);
  }

  const response = intlMiddleware(request);

  // next-intl issues 307 (temporary) redirects for locale detection/prefix
  // (e.g. / → /fr, /pricing → /fr/pricing). These are permanent site
  // structure, so upgrade them to 308 to consolidate indexing signals.
  if (response.status === 307) {
    const location = response.headers.get('location');
    if (location) {
      const redirect = NextResponse.redirect(new URL(location, request.url), 308);
      for (const cookie of response.headers.getSetCookie()) {
        redirect.headers.append('set-cookie', cookie);
      }
      return redirect;
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
