import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "ownsurface_session";

function redirectTo(request: NextRequest, pathname: string, extra?: Record<string, string>) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      url.searchParams.set(key, value);
    }
  }

  return NextResponse.redirect(url);
}

export function proxy(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/dashboard") && !hasSession) {
    return redirectTo(request, "/login", { next: `${pathname}${search}` });
  }

  // Don't redirect away from auth pages server-side — the cookie may be stale.
  // The login page itself redirects authenticated users to /dashboard client-side.


  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register", "/register/:path*", "/reset-password"],
};
