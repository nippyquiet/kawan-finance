import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Routes that don't require auth
const publicPaths = ["/api/auth", "/_next", "/favicon.ico"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Allow public paths
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow API routes (they handle auth internally)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // If not logged in, redirect to login
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
