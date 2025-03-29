import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === "/login"

  // Check if the user is authenticated
  const isAuthenticated = request.cookies.has("isAuthenticated")

  // If the path is not public and the user is not authenticated, redirect to login
  if (!isPublicPath && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If the path is login and the user is authenticated, redirect to home
  if (isPublicPath && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Otherwise, continue with the request
  return NextResponse.next()
}

// Configure which paths should trigger this middleware
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

