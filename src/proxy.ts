import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PATHS = ["/app", "/dashboard"];
const AUTH_PATHS = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  const isProtected = PROTECTED_PATHS.some((p) => path.startsWith(p));
  const isAuthPath = AUTH_PATHS.some((p) => path.startsWith(p));

  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", path);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
