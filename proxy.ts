import { updateSession } from '@/app/_shared/lib/supabase/middleware'
import { createClient } from '@/app/_shared/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Root proxy for global session management and route protection
 * Runs on all requests except static files
 */
export async function proxy(request: NextRequest) {
  // Refresh session if needed
  const response = await updateSession(request)

  // Protected routes that require authentication
  const protectedPaths = [
    '/dashboard',
    '/profil',
    '/admin',
  ]

  // Check if current path is protected
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath) {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    // Redirect to login if not authenticated
    if (error || !user) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('next', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // For admin routes, check admin role (when implemented)
    if (request.nextUrl.pathname.startsWith('/admin')) {
      // TODO: Add admin role check when RBAC is implemented
      // const { data: participant } = await supabase
      //   .from('participants')
      //   .select('role')
      //   .eq('user_id', user.id)
      //   .single()
      //
      // if (participant?.role !== 'admin') {
      //   return NextResponse.redirect(new URL('/dashboard', request.url))
      // }
    }
  }

  return response
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
}
