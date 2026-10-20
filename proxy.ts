import { updateSession } from '@/app/_shared/lib/supabase/middleware';
import { createClient } from '@/app/_shared/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';
import { buildContentSecurityPolicy } from '@/app/_shared/lib/security/csp';

/**
 * Root proxy for global session management and route protection
 * Runs on all requests except static files
 */
export async function proxy(request: NextRequest) {
  // /admin is not blocked here: the page and every admin action check is_event_admin() on the
  // server, and the database checks it again. The proxy is a convenience, not a security gate.

  // A fresh nonce per request. Next.js reads it from the request's CSP header and adds it to
  // its scripts; the layout reads x-nonce for our own inline script.
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildContentSecurityPolicy(nonce);

  // Refresh session if needed
  const response = await updateSession(request, {
    'x-nonce': nonce,
    'Content-Security-Policy': csp,
  });
  response.headers.set('Content-Security-Policy', csp);

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/profil'];

  // Check if current path is protected
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (isProtectedPath) {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Redirect to login if not authenticated
    if (error || !user) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('next', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
