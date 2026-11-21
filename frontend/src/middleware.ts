import { NextResponse, type NextRequest } from "next/server";

// Define route prefixes requiring an authenticated session
const PROTECTED_PREFIXES = ["/admin/dashboard", "/admin/superadmin", "/admin/quizzes"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if current route requires authentication
  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  const authCookie = request.cookies.get("admin_access_token")?.value;

  // 1. Block direct URL typing/navigation to protected routes if unauthenticated
  if (isProtectedRoute && !authCookie) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If already authenticated and hitting the login page, redirect to dashboard
  if (pathname === "/admin/login" && authCookie) {
    const dashboardUrl = new URL("/admin/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
