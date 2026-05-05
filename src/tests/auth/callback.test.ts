import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    redirect: (url: URL) => Response.redirect(url.toString(), 307),
  },
}));
vi.mock("@/lib/supabase/server", () => ({ createServerClient: vi.fn() }));

import { GET } from "@/app/auth/callback/route";
import { createServerClient } from "@/lib/supabase/server";

function makeSupabase(
  verifyResult: { error: unknown } = { error: null },
  exchangeResult: { error: unknown } = { error: null }
) {
  return {
    auth: {
      verifyOtp: vi.fn().mockResolvedValue(verifyResult),
      exchangeCodeForSession: vi.fn().mockResolvedValue(exchangeResult),
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "u1", email: "a@b.com" } },
      }),
    },
  };
}

describe("GET /auth/callback", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("token_hash path (magic link from webhook)", () => {
    it("calls verifyOtp with token_hash + type and redirects to next", async () => {
      const sb = makeSupabase();
      vi.mocked(createServerClient).mockResolvedValue(sb as any);

      const res = await GET(
        new Request(
          "http://localhost:3000/auth/callback?token_hash=abc123&type=email&next=/dashboard/report/xyz"
        )
      );

      expect(sb.auth.verifyOtp).toHaveBeenCalledWith({
        token_hash: "abc123",
        type: "email",
      });
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe(
        "http://localhost:3000/dashboard/report/xyz"
      );
    });

    it("redirects to /?error=auth_otp_failed when verifyOtp errors", async () => {
      const sb = makeSupabase({ error: { message: "OTP expired" } });
      vi.mocked(createServerClient).mockResolvedValue(sb as any);

      const res = await GET(
        new Request(
          "http://localhost:3000/auth/callback?token_hash=abc123&type=email"
        )
      );

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("error=auth_otp_failed");
    });

    it("rejects invalid type values (falls through to auth_no_code)", async () => {
      const sb = makeSupabase();
      vi.mocked(createServerClient).mockResolvedValue(sb as any);

      // 'magiclink' is deprecated and not in the whitelist
      const res = await GET(
        new Request(
          "http://localhost:3000/auth/callback?token_hash=abc123&type=magiclink"
        )
      );

      expect(sb.auth.verifyOtp).not.toHaveBeenCalled();
      expect(res.headers.get("location")).toContain("error=auth_no_code");
    });
  });

  describe("code path (OAuth / PKCE code exchange)", () => {
    it("calls exchangeCodeForSession and redirects to next", async () => {
      const sb = makeSupabase();
      vi.mocked(createServerClient).mockResolvedValue(sb as any);

      const res = await GET(
        new Request(
          "http://localhost:3000/auth/callback?code=pkce_code_xyz&next=/dashboard"
        )
      );

      expect(sb.auth.exchangeCodeForSession).toHaveBeenCalledWith(
        "pkce_code_xyz"
      );
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe(
        "http://localhost:3000/dashboard"
      );
    });

    it("redirects to /?error=auth_exchange_failed when exchange errors", async () => {
      const sb = makeSupabase(
        { error: null },
        { error: { message: "invalid code" } }
      );
      vi.mocked(createServerClient).mockResolvedValue(sb as any);

      const res = await GET(
        new Request("http://localhost:3000/auth/callback?code=bad_code")
      );

      expect(res.headers.get("location")).toContain("error=auth_exchange_failed");
    });
  });

  describe("no-params path", () => {
    it("redirects to /?error=auth_no_code when neither code nor token_hash is present", async () => {
      const sb = makeSupabase();
      vi.mocked(createServerClient).mockResolvedValue(sb as any);

      const res = await GET(
        new Request("http://localhost:3000/auth/callback")
      );

      expect(sb.auth.verifyOtp).not.toHaveBeenCalled();
      expect(sb.auth.exchangeCodeForSession).not.toHaveBeenCalled();
      expect(res.headers.get("location")).toContain("error=auth_no_code");
    });
  });

  describe("open-redirect protection", () => {
    it("replaces next=https://evil.com with /dashboard", async () => {
      const sb = makeSupabase();
      vi.mocked(createServerClient).mockResolvedValue(sb as any);

      const res = await GET(
        new Request(
          "http://localhost:3000/auth/callback?token_hash=abc&type=email&next=https://evil.com"
        )
      );

      expect(res.headers.get("location")).toBe(
        "http://localhost:3000/dashboard"
      );
    });

    it("replaces next=//evil.com (protocol-relative) with /dashboard", async () => {
      const sb = makeSupabase();
      vi.mocked(createServerClient).mockResolvedValue(sb as any);

      const res = await GET(
        new Request(
          "http://localhost:3000/auth/callback?token_hash=abc&type=email&next=//evil.com"
        )
      );

      expect(res.headers.get("location")).toBe(
        "http://localhost:3000/dashboard"
      );
    });

    it("allows safe relative paths like /dashboard/report/abc", async () => {
      const sb = makeSupabase();
      vi.mocked(createServerClient).mockResolvedValue(sb as any);

      const res = await GET(
        new Request(
          "http://localhost:3000/auth/callback?token_hash=abc&type=email&next=/dashboard/report/abc"
        )
      );

      expect(res.headers.get("location")).toBe(
        "http://localhost:3000/dashboard/report/abc"
      );
    });

    it("blocks /\\evil.com backslash bypass (WHATWG URL parser treats \\ as /)", async () => {
      const sb = makeSupabase();
      vi.mocked(createServerClient).mockResolvedValue(sb as any);

      // new URL("/\\evil.com", "http://localhost:3000") → http://evil.com/
      // String check next.startsWith("/") && !next.startsWith("//") would PASS this.
      // getSafeNext() catches it via origin comparison.
      const res = await GET(
        new Request(
          "http://localhost:3000/auth/callback?token_hash=abc&type=email&next=%2F%5Cevil.com"
        )
      );

      expect(res.headers.get("location")).toBe(
        "http://localhost:3000/dashboard"
      );
    });
  });
});
