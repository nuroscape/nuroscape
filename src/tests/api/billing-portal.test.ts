import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => Response.json(body, init),
  },
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/stripe/config", () => ({
  stripe: {
    billingPortal: {
      sessions: { create: vi.fn().mockResolvedValue({ url: "https://billing.stripe.com/session_test" }) },
    },
  },
}));

import { POST } from "@/app/api/billing-portal/route";
import { createClient } from "@/lib/supabase/server";

describe("POST /api/billing-portal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("401 — unauthenticated user", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as any);

    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("404 — authenticated user with no subscription", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user_123" } } }) },
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
        }),
      }),
    } as any);

    const res = await POST();
    expect(res.status).toBe(404);
  });

  it("200 — returns Stripe billing portal URL", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user_123" } } }) },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({
              data: { stripe_customer_id: "cus_test" },
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    const res = await POST();
    expect(res.status).toBe(200);
    const json = await res.json() as { url: string };
    expect(json.url).toBe("https://billing.stripe.com/session_test");
  });
});
