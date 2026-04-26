-- Idempotency table for Stripe webhook events.
-- event_id is the Stripe event ID (e.g. "evt_1234...").
-- Before processing any webhook, we insert here.
-- If the INSERT fails (unique violation), the event was already handled → return 200.

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   TEXT        NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Webhook handler uses service role key (createAdminClient) → RLS bypassed.
-- Deny all access from user JWTs as an extra safety layer.
CREATE POLICY "deny all non-service-role" ON public.stripe_webhook_events
  FOR ALL USING (false) WITH CHECK (false);
