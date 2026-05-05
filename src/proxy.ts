import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PATHS = ["/app", "/dashboard"];

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  if (PROTECTED_PATHS.some((p) => path.startsWith(p)) && !user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Exclude static assets, webhook (no user cookies), and generate-report (internal secret).
    // /auth/callback is deliberately NOT excluded — it needs updateSession to propagate cookies.
    "/((?!_next/static|_next/image|favicon\\.ico|api/webhooks|api/generate-report|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
