import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// Allowed OTP types for the token_hash flow (magiclink and signup are deprecated)
const ALLOWED_OTP_TYPES = ["email", "recovery", "invite"] as const;
type AllowedOtpType = (typeof ALLOWED_OTP_TYPES)[number];

function isAllowedOtpType(value: string | null): value is AllowedOtpType {
  return ALLOWED_OTP_TYPES.includes(value as AllowedOtpType);
}

// Build a safe redirect path, verifying the final origin matches ours.
// String-prefix checks (/foo, //evil.com) are bypassable via backslash:
// new URL("/\\evil.com", origin) → http://evil.com/ in WHATWG URL parser.
function getSafeNext(next: string | null, origin: string): string {
  if (!next) return "/dashboard";
  try {
    const url = new URL(next, origin);
    if (url.origin === origin) return url.pathname + url.search;
  } catch {}
  return "/dashboard";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const safeNext = getSafeNext(searchParams.get("next"), origin);

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = await createServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/callback] exchangeCodeForSession failed:", error);
      return NextResponse.redirect(
        new URL("/?error=auth_exchange_failed", origin)
      );
    }
  } else if (tokenHash && isAllowedOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (error) {
      console.error("[auth/callback] verifyOtp failed:", error);
      return NextResponse.redirect(
        new URL("/?error=auth_otp_failed", origin)
      );
    }
  } else {
    console.error(
      "[auth/callback] missing or invalid params:",
      Object.fromEntries(searchParams)
    );
    return NextResponse.redirect(new URL("/?error=auth_no_code", origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log("[auth/callback] session established for:", user?.email);
  console.log("[auth/callback] redirecting to:", safeNext);

  return NextResponse.redirect(new URL(safeNext, origin));
}
