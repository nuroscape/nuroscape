import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => Response.json(body, init),
  },
}));
vi.mock("@/lib/supabase/server", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/stripe/config", () => ({
  stripe: {
    checkout: { sessions: { create: vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/test" }) } },
  },
  STRIPE_PLANS: { trial: { priceId: "price_test", trialDays: 7 } },
}));

import { POST } from "@/app/api/checkout/route";
import { createAdminClient } from "@/lib/supabase/server";

function mockDb(paid: boolean | null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({
            data: paid === null ? null : { paid },
            error: null,
          }),
        }),
      }),
    }),
  };
}

function req(body: unknown) {
  return new Request("http://localhost/api/checkout", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/checkout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("400 — missing session_id", async () => {
    const res = await POST(req({}));
    expect(res.status).toBe(400);
  });

  it("404 — assessment not found", async () => {
    vi.mocked(createAdminClient).mockResolvedValue(mockDb(null) as any);
    const res = await POST(req({ session_id: "ghost" }));
    expect(res.status).toBe(404);
  });

  it("409 — already paid", async () => {
    vi.mocked(createAdminClient).mockResolvedValue(mockDb(true) as any);
    const res = await POST(req({ session_id: "paid-session" }));
    expect(res.status).toBe(409);
  });

  it("200 — returns Stripe URL for unpaid assessment", async () => {
    vi.mocked(createAdminClient).mockResolvedValue(mockDb(false) as any);
    const res = await POST(req({ session_id: "fresh-session" }));
    expect(res.status).toBe(200);
    const json = await res.json() as { url: string };
    expect(json.url).toBe("https://checkout.stripe.com/test");
  });
});
