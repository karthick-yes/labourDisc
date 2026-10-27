import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/config/app";

// Optimistic check only: sends visitors without a session cookie to /login.
// The real check (is the session valid?) happens in requireContractor().
export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Public: login/signup, worker profile pages (/w/...), admin (own PIN),
  // API routes, Next internals and static files.
  matcher: ["/((?!login|signup|w/|admin|api/|_next/|favicon.ico|.*\\..*).*)"],
};
