import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => Response.json(body, init),
  },
  after: vi.fn(), // no-op in tests
}));
vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/stripe/config", () => ({ stripe: { webhooks: { constructEvent: vi.fn() } } }));
vi.mock("@/lib/resend", () => ({ sendWelcomeEmail: vi.fn().mockResolvedValue(undefined) }));

import { POST } from "@/app/api/webhooks/stripe/route";
import { createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/config";
import { headers } from "next/headers";

function makeEvent(id: string, type = "customer.subscription.updated") {
  return {
    id,
    type,
    data: { object: { id: "sub_test", status: "active", cancel_at: null } },
  };
}

function makeRequest() {
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    body: JSON.stringify({}),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/webhooks/stripe — idempotency", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 immediately when event_id insert fails (any error — includes duplicates)", async () => {
    const updateFn = vi.fn();
    vi.mocked(headers).mockResolvedValue({
      get: (k: string) => (k === "stripe-signature" ? "sig" : null),
    } as any);
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(makeEvent("evt_dup") as any);
    // The route returns 200 for any idempotency insert error (not just unique violations).
    // This is an accepted design trade-off: simplicity over distinguishing transient DB errors.
    // See: GSTACK review 2026-04-25 — Issue 4 accepted as-is.
    vi.mocked(createAdminClient).mockResolvedValue({
      from: (table: string) => {
        if (table === "stripe_webhook_events")
          return { insert: vi.fn().mockResolvedValue({ error: { message: "duplicate key value" } }) };
        return { update: updateFn };
      },
    } as any);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(updateFn).not.toHaveBeenCalled();
  });

  it("processes a new event_id and updates the subscription", async () => {
    const idempotencyInsert = vi.fn().mockResolvedValue({ error: null });
    const subUpdateEq = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(headers).mockResolvedValue({
      get: (k: string) => (k === "stripe-signature" ? "sig" : null),
    } as any);
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(makeEvent("evt_new") as any);
    vi.mocked(createAdminClient).mockResolvedValue({
      from: (table: string) => {
        if (table === "stripe_webhook_events") return { insert: idempotencyInsert };
        if (table === "subscriptions") return { update: () => ({ eq: subUpdateEq }) };
        return {};
      },
    } as any);

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(idempotencyInsert).toHaveBeenCalledWith({ event_id: "evt_new" });
    expect(subUpdateEq).toHaveBeenCalled();
  });
});
