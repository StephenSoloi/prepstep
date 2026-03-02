import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Decide what routes should be public (landing page, API routes you want open, etc.)
const isPublicRoute = createRouteMatcher(['/', '/pricing', '/api/(.*)'])

export default clerkMiddleware(async (auth, req) => {
    if (!isPublicRoute(req)) {
        // Requires users to be signed in to hit protected routes (like /dashboard)
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
