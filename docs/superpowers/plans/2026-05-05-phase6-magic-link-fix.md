# Phase 6 — Magic Link Auth Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the Stripe webhook → magic link → session auth flow so that users who click the emailed link land on their report page, authenticated, with SSR cookies set.

**Architecture:** `admin.generateLink()` always produces implicit-flow links (OTP token in URL hash) that cannot be read server-side. The fix is to extract the `hashed_token` from the response and build our own callback URL that goes to `/auth/callback?token_hash=xxx&type=email&next=...`. The Next.js callback route then calls `supabase.auth.verifyOtp({ token_hash, type: 'email' })` which works with `@supabase/ssr`'s cookie-based storage.

**Tech Stack:** Next.js 16.2.4 App Router, `@supabase/ssr` v0.10.2, `@supabase/auth-js`, Vitest, TypeScript strict

---

## Critical Clarification: PKCE vs. `hashed_token`

The spec mentions "forcing PKCE via `flowType: 'pkce'`". After auditing the installed packages:

- **`@supabase/ssr`'s `createServerClient` already hardcodes `flowType: 'pkce'`** — it's not an option, it's always on. The admin client already has it set.
- **`admin.generateLink()` does NOT respect `flowType`** — it is an admin API call that generates an OTP token and returns `action_link` (pointing to `supabase.co/auth/v1/verify?token=xxx`). When clicked, Supabase redirects to your `redirect_to` with tokens **in the URL hash** (implicit flow), because no PKCE code_challenge was registered. The server never sees them.
- **The Supabase-recommended SSR approach** is to use `properties.hashed_token` (returned alongside `action_link`) to build your own callback URL, then call `verifyOtp({ token_hash })` server-side. This is documented in the auth-js source: *"The `TokenHash` is contained in the email templates and can be used to sign in. You may wish to use the hash for the PKCE flow for Server Side Auth."*

The middleware (`updateSession`) and proxy (`proxy.ts`) are **already correctly configured**. No changes needed there beyond an optional matcher optimization.

---

## Pre-flight: What already works

| Component | Status |
|---|---|
| `@supabase/ssr` installed, `flowType: 'pkce'` hardcoded in `createServerClient` | ✅ done |
| `src/lib/supabase/middleware.ts` with `updateSession` | ✅ done |
| `src/proxy.ts` calling `updateSession` | ✅ done |
| `createServerClient()` (anon key + cookies) for server components | ✅ done |
| `createAdminClient()` (service_role key) for webhook | ✅ done, but reads cookies unnecessarily |
| `/auth/callback` with `exchangeCodeForSession` | ✅ exists but only handles `code`, not `token_hash` |

---

## File Map

| Action | File | What changes |
|---|---|---|
| Modify | `src/lib/supabase/server.ts` | Simplify `createAdminClient` — remove cookies (service_role doesn't need them) |
| Modify | `src/app/api/webhooks/stripe/route.ts` | Extract `hashed_token`, build SSR callback URL, add debug logs |
| Modify | `src/app/auth/callback/route.ts` | Handle `token_hash` + `code` paths, distinct error codes, open-redirect protection |
| Modify | `src/proxy.ts` | Update matcher to skip `/api/webhooks/*` and `/api/generate-report` |
| Create | `src/tests/api/webhook-checkout.test.ts` | Test `checkout.session.completed` magic link generation |
| Create | `src/tests/auth/callback.test.ts` | Test all `/auth/callback` branches |

---

## Task 1: Simplify `createAdminClient` (service_role must not touch user cookies)

**Files:**
- Modify: `src/lib/supabase/server.ts`

**Why:** `createAdminClient` currently uses `@supabase/ssr`'s `createServerClient` with the service_role key. This forces PKCE mode and reads user cookies — both unnecessary for admin operations that bypass RLS entirely. Using plain `createClient` from `@supabase/supabase-js` is cleaner and more correct.

**No test needed:** the webhook tests fully mock `createAdminClient`'s return value, so internal implementation doesn't affect them.

- [ ] **Step 1: Read current server.ts**

  Confirm the current file at `src/lib/supabase/server.ts`:
  ```typescript
  import { createServerClient } from "@supabase/ssr";
  import { cookies } from "next/headers";
  import type { Database } from "@/types/database";
  
  export async function createClient() { ... }   // anon key + cookies — keep as-is
  export { createClient as createServerClient };  // alias — keep as-is
  
  export async function createAdminClient() {
    const cookieStore = await cookies();
    return createServerClient<Database>(         // ← change this
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll() {...}, setAll(...){...} } }
    );
  }
  ```

- [ ] **Step 2: Replace `createAdminClient` with a pure service_role client**

  Replace only the `createAdminClient` function in `src/lib/supabase/server.ts`. Leave `createClient` and the `createServerClient` alias unchanged.

  ```typescript
  import { createClient as createSupabaseClient } from "@supabase/supabase-js";
  ```

  Add this import at the top alongside the existing imports, then replace the function body:

  ```typescript
  export async function createAdminClient() {
    return createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  ```

  The function stays `async` so all callers (`await createAdminClient()`) continue to compile unchanged.

- [ ] **Step 3: Verify the import from `@supabase/supabase-js` is available**

  Run:
  ```bash
  node -e "require('@supabase/supabase-js')" && echo "ok"
  ```
  Expected: `ok`

- [ ] **Step 4: Run existing tests to confirm nothing broke**

  ```bash
  cd /Users/oscarkalil/nuroscape && npm run test -- --reporter=verbose 2>&1 | tail -20
  ```
  Expected: `9 passed`

- [ ] **Step 5: Commit**

  ```bash
  git add src/lib/supabase/server.ts
  git commit -m "refactor(supabase): createAdminClient uses plain createClient (no cookies)"
  ```

---

## Task 2: Write failing test for webhook magic link generation

**Files:**
- Create: `src/tests/api/webhook-checkout.test.ts`

The existing `webhook-idempotency.test.ts` only tests `customer.subscription.updated`. We need a test for the `checkout.session.completed` path that verifies the magic link uses `hashed_token`, not `action_link`.

- [ ] **Step 1: Create the test file**

  Create `src/tests/api/webhook-checkout.test.ts`:

  ```typescript
  import { vi, describe, it, expect, beforeEach } from "vitest";

  vi.mock("next/server", () => ({
    NextResponse: {
      json: (body: unknown, init?: ResponseInit) => Response.json(body, init),
    },
    after: vi.fn(),
  }));
  vi.mock("next/headers", () => ({ headers: vi.fn() }));
  vi.mock("@/lib/supabase/server", () => ({ createAdminClient: vi.fn() }));
  vi.mock("@/lib/stripe/config", () => ({
    stripe: { webhooks: { constructEvent: vi.fn() } },
  }));
  vi.mock("@/lib/resend", () => ({
    sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
  }));

  import { POST } from "@/app/api/webhooks/stripe/route";
  import { createAdminClient } from "@/lib/supabase/server";
  import { stripe } from "@/lib/stripe/config";
  import { headers } from "next/headers";
  import { sendWelcomeEmail } from "@/lib/resend";

  const HASHED_TOKEN = "hashed_abc123xyz";
  const APP_URL = "http://localhost:3000";
  const ASSESSMENT_ID = "assessment_uuid_001";

  function makeCheckoutEvent(id = "evt_checkout_1") {
    return {
      id,
      type: "checkout.session.completed",
      data: {
        object: {
          customer_details: { email: "test@example.com" },
          metadata: { session_id: "sess_abc123" },
          subscription: "sub_123",
          customer: "cus_123",
        },
      },
    };
  }

  function makeAdminClient(hashedToken: string | null = HASHED_TOKEN) {
    return {
      from: (table: string) => {
        if (table === "stripe_webhook_events")
          return { insert: vi.fn().mockResolvedValue({ error: null }) };
        if (table === "users")
          return { upsert: vi.fn().mockResolvedValue({ error: null }) };
        if (table === "subscriptions")
          return { upsert: vi.fn().mockResolvedValue({ error: null }) };
        if (table === "assessments")
          return {
            update: () => ({ eq: vi.fn().mockResolvedValue({ error: null }) }),
            select: () => ({
              eq: () => ({
                maybeSingle: vi
                  .fn()
                  .mockResolvedValue({ data: { id: ASSESSMENT_ID } }),
              }),
            }),
          };
        return {};
      },
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user_uuid_001" } },
            error: null,
          }),
          generateLink: vi.fn().mockResolvedValue({
            data: {
              properties: hashedToken
                ? {
                    action_link:
                      "https://project.supabase.co/auth/v1/verify?token=xxx",
                    hashed_token: hashedToken,
                  }
                : null,
              user: {},
            },
            error: null,
          }),
        },
      },
    };
  }

  describe("POST /api/webhooks/stripe — checkout.session.completed magic link", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      process.env.NEXT_PUBLIC_APP_URL = APP_URL;
    });

    it("sends email with token_hash callback URL (not action_link)", async () => {
      vi.mocked(headers).mockResolvedValue({
        get: (k: string) => (k === "stripe-signature" ? "sig" : null),
      } as any);
      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(
        makeCheckoutEvent() as any
      );
      vi.mocked(createAdminClient).mockResolvedValue(
        makeAdminClient(HASHED_TOKEN) as any
      );

      const res = await POST(
        new Request("http://localhost/api/webhooks/stripe", {
          method: "POST",
          body: JSON.stringify({}),
          headers: { "Content-Type": "application/json" },
        })
      );

      expect(res.status).toBe(200);

      // Must use token_hash-based URL
      expect(sendWelcomeEmail).toHaveBeenCalledWith(
        "test@example.com",
        expect.stringContaining(`token_hash=${HASHED_TOKEN}`)
      );
      expect(sendWelcomeEmail).toHaveBeenCalledWith(
        "test@example.com",
        expect.stringContaining("type=email")
      );
      expect(sendWelcomeEmail).toHaveBeenCalledWith(
        "test@example.com",
        expect.stringContaining(`/dashboard/report/${ASSESSMENT_ID}`)
      );
      // Must NOT send raw Supabase action_link
      expect(sendWelcomeEmail).toHaveBeenCalledWith(
        "test@example.com",
        expect.not.stringContaining("supabase.co")
      );
    });

    it("skips sending email when generateLink returns no hashed_token", async () => {
      vi.mocked(headers).mockResolvedValue({
        get: (k: string) => (k === "stripe-signature" ? "sig" : null),
      } as any);
      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(
        makeCheckoutEvent("evt_checkout_2") as any
      );
      vi.mocked(createAdminClient).mockResolvedValue(
        makeAdminClient(null) as any
      );

      const res = await POST(
        new Request("http://localhost/api/webhooks/stripe", {
          method: "POST",
          body: JSON.stringify({}),
          headers: { "Content-Type": "application/json" },
        })
      );

      expect(res.status).toBe(200);
      expect(sendWelcomeEmail).not.toHaveBeenCalled();
    });
  });
  ```

- [ ] **Step 2: Run test — confirm it FAILS**

  ```bash
  cd /Users/oscarkalil/nuroscape && npm run test -- src/tests/api/webhook-checkout.test.ts --reporter=verbose 2>&1 | tail -20
  ```
  Expected: FAIL — `sendWelcomeEmail` was called with the `action_link` URL (containing `supabase.co`), not the `token_hash` URL.

---

## Task 3: Fix webhook to use `hashed_token`

**Files:**
- Modify: `src/app/api/webhooks/stripe/route.ts` (lines 154–167)

- [ ] **Step 1: Locate the magic link block**

  In `src/app/api/webhooks/stripe/route.ts`, find this block (around line 154):
  ```typescript
  try {
    const linkResult = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${appUrl}/auth/callback?next=${reportPath}`,
      },
    });
    if (linkResult.data?.properties?.action_link) {
      await sendWelcomeEmail(email, linkResult.data.properties.action_link);
    }
  } catch (e) {
    console.error("[webhook] sendWelcomeEmail error:", e);
  }
  ```

- [ ] **Step 2: Replace with `hashed_token`-based magic link + debug logging**

  Replace the block above with:
  ```typescript
  try {
    const linkResult = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${appUrl}/auth/callback`,
      },
    });
    const tokenHash = linkResult.data?.properties?.hashed_token;
    console.log("🔗 [DEBUG] hashed_token:", tokenHash ?? "MISSING");
    console.log("🔗 [DEBUG] target email:", email);
    console.log("🔗 [DEBUG] report path:", reportPath);
    if (tokenHash) {
      const magicLink = `${appUrl}/auth/callback?token_hash=${tokenHash}&type=email&next=${encodeURIComponent(reportPath)}`;
      console.log("🔗 [DEBUG] magic link sent:", magicLink);
      await sendWelcomeEmail(email, magicLink);
    }
  } catch (e) {
    console.error("[webhook] sendWelcomeEmail error:", e);
  }
  ```

  **Why `encodeURIComponent(reportPath)`:** `reportPath` is `/dashboard/report/abc123` — the `/` characters need to be encoded when used as a query param value to avoid misparse.

  **Why `redirectTo: ${appUrl}/auth/callback` (simplified):** The `redirectTo` only matters if the `action_link` itself is used (it's embedded in the Supabase verify URL). Since we're not sending `action_link` to the user, this is a safe fallback that won't cause redirect errors if Supabase ever validates it.

- [ ] **Step 3: Run the new test — confirm it PASSES**

  ```bash
  cd /Users/oscarkalil/nuroscape && npm run test -- src/tests/api/webhook-checkout.test.ts --reporter=verbose 2>&1 | tail -20
  ```
  Expected: 2 passed

- [ ] **Step 4: Run all tests — confirm still 9 pass**

  ```bash
  cd /Users/oscarkalil/nuroscape && npm run test -- --reporter=verbose 2>&1 | tail -20
  ```
  Expected: 11 passed (9 existing + 2 new)

- [ ] **Step 5: Commit**

  ```bash
  git add src/app/api/webhooks/stripe/route.ts src/tests/api/webhook-checkout.test.ts
  git commit -m "fix(webhook): use hashed_token for SSR-compatible magic link; add debug logs"
  ```

---

## Task 4: Write failing tests for `/auth/callback`

**Files:**
- Create: `src/tests/auth/callback.test.ts`

- [ ] **Step 1: Create the test file**

  Create `src/tests/auth/callback.test.ts`:

  ```typescript
  import { vi, describe, it, expect, beforeEach } from "vitest";

  // Next.js route handlers use NextResponse; mock it to a plain Response
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

        // 'magiclink' is deprecated and not in our whitelist for token_hash path
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
          new Request(
            "http://localhost:3000/auth/callback?code=bad_code"
          )
        );

        expect(res.headers.get("location")).toContain(
          "error=auth_exchange_failed"
        );
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

      it("blocks /\\\\evil.com backslash bypass (WHATWG URL parser treats \\\\ as /)", async () => {
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
  ```

- [ ] **Step 2: Run test — confirm it FAILS**

  ```bash
  cd /Users/oscarkalil/nuroscape && npm run test -- src/tests/auth/callback.test.ts --reporter=verbose 2>&1 | tail -30
  ```
  Expected: most tests FAIL — current callback doesn't handle `token_hash`, uses generic `auth_failed` error codes, and has no open-redirect protection.

---

## Task 5: Fix `/auth/callback`

**Files:**
- Modify: `src/app/auth/callback/route.ts`

The current file (28 lines) needs to be replaced entirely. Current logic:
- Handles `code` (correct)
- Falls through to `getUser()` (implicit-flow fallback — broken)
- No open-redirect protection
- Single error code (`auth_failed`)

New logic:
- Handle `code` → `exchangeCodeForSession`
- Handle `token_hash` + validated `type` → `verifyOtp`
- No params → immediate error redirect
- Open-redirect protection on `next`
- Distinct error codes per failure mode

- [ ] **Step 1: Check the correct import for `VerifyTokenHashParams`**

  ```bash
  grep "VerifyTokenHashParams" /Users/oscarkalil/nuroscape/node_modules/@supabase/auth-js/dist/main/lib/types.d.ts | head -3
  ```
  Expected output: the `VerifyTokenHashParams` interface definition. If it exists, we can import it. If not, we'll inline the type.

- [ ] **Step 2: Replace `/auth/callback/route.ts`**

  Write the complete new file at `src/app/auth/callback/route.ts`:

  ```typescript
  import { NextResponse } from "next/server";
  import { createServerClient } from "@/lib/supabase/server";

  // Allowed OTP types for the token_hash flow (magiclink and signup are deprecated)
  const ALLOWED_OTP_TYPES = ["email", "recovery", "invite"] as const;
  type AllowedOtpType = (typeof ALLOWED_OTP_TYPES)[number];

  function isAllowedOtpType(value: string | null): value is AllowedOtpType {
    return ALLOWED_OTP_TYPES.includes(value as AllowedOtpType);
  }

  // Build a safe redirect URL, verifying the final origin matches ours.
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
  ```

  **Type safety note:** `supabase.auth.verifyOtp({ token_hash, type })` where `type` is `AllowedOtpType` satisfies `EmailOtpType` from `@supabase/auth-js`. TypeScript will accept this without casts because `AllowedOtpType` is a subset of `EmailOtpType`.

- [ ] **Step 3: Run the callback tests — confirm they PASS**

  ```bash
  cd /Users/oscarkalil/nuroscape && npm run test -- src/tests/auth/callback.test.ts --reporter=verbose 2>&1 | tail -30
  ```
  Expected: all tests pass.

- [ ] **Step 4: Run the full test suite**

  ```bash
  cd /Users/oscarkalil/nuroscape && npm run test -- --reporter=verbose 2>&1 | tail -20
  ```
  Expected: all tests pass (9 original + 2 webhook-checkout + N callback = total 11+N).

- [ ] **Step 5: Commit**

  ```bash
  git add src/app/auth/callback/route.ts src/tests/auth/callback.test.ts
  git commit -m "fix(auth): callback handles token_hash via verifyOtp; open-redirect protection; distinct error codes"
  ```

---

## Task 6: Update proxy matcher (optimization)

**Files:**
- Modify: `src/proxy.ts`

The current matcher runs `updateSession` on ALL requests including `/api/webhooks/stripe`. The webhook has no user cookies, so `getUser()` always returns null there — it's a no-op but wastes a Supabase round-trip per webhook call.

- [ ] **Step 1: Read current proxy.ts**

  Verify the current matcher at `src/proxy.ts`:
  ```typescript
  export const config = {
    matcher: [
      "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
  };
  ```

- [ ] **Step 2: Update matcher to exclude API routes that never have user sessions**

  Replace the `config` export at the bottom of `src/proxy.ts`:

  ```typescript
  export const config = {
    matcher: [
      "/((?!_next/static|_next/image|favicon\\.ico|api/webhooks|api/generate-report|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
  };
  ```

  This excludes:
  - `_next/static`, `_next/image`, `favicon.ico`, static asset extensions (unchanged)
  - `api/webhooks` — Stripe webhook, never has user cookies, processes quickly
  - `api/generate-report` — internal background call with `x-internal-secret`, no user cookies

  `/auth/callback` is deliberately NOT excluded — it needs `updateSession` to properly set the SSR cookies from the `verifyOtp` response.

- [ ] **Step 3: Run all tests to confirm nothing broke**

  ```bash
  cd /Users/oscarkalil/nuroscape && npm run test -- --reporter=verbose 2>&1 | tail -20
  ```
  Expected: all tests pass (matcher changes don't affect unit tests).

- [ ] **Step 4: Commit**

  ```bash
  git add src/proxy.ts
  git commit -m "perf(proxy): exclude webhook and generate-report from updateSession middleware"
  ```

---

## End-to-End Validation Steps (manual, after all tasks complete)

With `npm run dev` running on `:3000` and `stripe listen --forward-to localhost:3000/api/webhooks/stripe` running in a second terminal:

1. **Trigger a test checkout** via Stripe CLI:
   ```bash
   stripe trigger checkout.session.completed
   ```

2. **Watch dev terminal** for the debug logs:
   ```
   🔗 [DEBUG] hashed_token: abc123xyz...
   🔗 [DEBUG] target email: test@example.com
   🔗 [DEBUG] report path: /dashboard/report/uuid...
   🔗 [DEBUG] magic link sent: http://localhost:3000/auth/callback?token_hash=abc123xyz...&type=email&next=%2Fdashboard%2Freport%2Fuuid...
   ```

3. **Copy the magic link** from the dev logs and paste it in a browser. (Resend in test mode only delivers to the configured test email; use logs to test other emails.)

4. **Expected flow:**
   - Browser lands on `http://localhost:3000/auth/callback?token_hash=xxx&type=email&next=%2Fdashboard%2Freport%2Fxxx`
   - Server calls `verifyOtp({ token_hash, type: 'email' })` — Supabase verifies and sets cookies
   - **Critical check:** GoTrue was called with `type='email'` for a token created via `generateLink({ type: 'magiclink' })`. If this returns an error, switch the webhook to `&type=magiclink` and add `'magiclink'` to `ALLOWED_OTP_TYPES` in the callback.
   - Server-side log: `[auth/callback] session established for: user@email.com`
   - Browser redirects to `/dashboard/report/<id>`
   - Report page loads (RLS check passes — user_id matches the assessment)

5. **Press F5** on the report page — should stay authenticated (cookies persist)

6. **Open DevTools → Application → Cookies** — should see Supabase auth cookies (`sb-*`) set

---

## Cleanup (after validation)

- [ ] Remove the 4 `console.log("🔗 [DEBUG] ...")` lines from `src/app/api/webhooks/stripe/route.ts`
- [ ] Commit: `git commit -m "chore(webhook): remove magic link debug logs"`

---

## Self-Review

**Spec coverage:**
- ✅ Task 1: Supabase client refactor — `createAdminClient` is now a clean service_role client
- ✅ Task 2: Magic link generation — uses `hashed_token` (the correct SSR approach; not `flowType` which was already set)
- ✅ Task 3–4: `/auth/callback` refactored with `verifyOtp`, distinct error codes, open-redirect protection
- ✅ Task 5: Proxy matcher updated to exclude webhook/generate-report
- ✅ Debug logging added in Task 3, cleanup flagged after validation
- ✅ No changes to: Stripe Checkout flow, `/api/generate-report`, RLS policies, table structure
- ✅ TDD approach: failing tests written before implementations (Tasks 2 and 4)

**Placeholder scan:** None found. All code blocks are complete and executable.

**Type consistency:**
- `createServerClient` from `@/lib/supabase/server` is used consistently in callback
- `createAdminClient` from `@/lib/supabase/server` is used consistently in webhook
- `AllowedOtpType` in callback is a subset of `EmailOtpType` from `@supabase/auth-js` — TypeScript safe
- `hashed_token` property exists on `GenerateLinkProperties` (confirmed in `@supabase/auth-js/dist/main/lib/types.d.ts`)

**Edge cases addressed:**
- Gmail/AV scanner consumes `hashed_token` before user clicks → `verifyOtp` returns `otp_expired` → user sees `/?error=auth_otp_failed` (not a blank page)
- `next` param missing → defaults to `/dashboard`
- `next=https://evil.com` → `getSafeNext` constructs URL, origin mismatch → `/dashboard`
- `next=//evil.com` → origin mismatch → `/dashboard`
- `next=/\evil.com` (backslash bypass) → WHATWG URL parser resolves to `http://evil.com/`, origin mismatch → `/dashboard`
- `type=magiclink` (deprecated) → rejected, returns `auth_no_code`
- `generateLink` returns no `hashed_token` → email not sent, webhook still returns 200

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR (PLAN) | 3 issues, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**OUTSIDE VOICE (Claude subagent):** Found 1 P0 security issue (backslash open-redirect bypass — fixed in plan), 1 feasibility risk (`type=email` GoTrue compatibility — mitigated with manual E2E check), 1 docs error (Next.js version — fixed). No cross-model tension after fixes applied.

**UNRESOLVED:** 0 unresolved decisions

**VERDICT:** ENG CLEARED — ready to implement
