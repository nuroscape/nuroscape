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
    // next param is encodeURIComponent'd so slashes become %2F
    expect(sendWelcomeEmail).toHaveBeenCalledWith(
      "test@example.com",
      expect.stringContaining(encodeURIComponent(`/dashboard/report/${ASSESSMENT_ID}`))
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
