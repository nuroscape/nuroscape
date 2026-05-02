import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") ?? "/dashboard";
  const code = url.searchParams.get("code");

  const supabase = await createServerClient();

  // Si on a un PKCE code, on l'échange (cas standard)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/callback] exchangeCodeForSession error:", error);
      return NextResponse.redirect(new URL("/?error=auth_failed", url.origin));
    }
  }

  // Vérifie qu'une session existe maintenant (peu importe le mode auth)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error("[auth/callback] no user after auth flow:", userError);
    return NextResponse.redirect(new URL("/?error=auth_failed", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
