import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define rotas públicas (que não precisam de autenticação)
// Todas as rotas /api/* são públicas no middleware pois a autenticação
// é feita pelo backend via o proxy route
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Bypass auth in E2E testing mode
  if (process.env.PLAYWRIGHT_TEST === 'true') return

  // Proteger todas as rotas exceto as públicas
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
