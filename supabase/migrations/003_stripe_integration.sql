-- Idempotency table for Stripe webhook events.
-- event_id is the Stripe event ID (e.g. "evt_1234...").
-- Before processing any webhook, we insert here.
-- If the INSERT fails (unique violation), the event was already handled → return 200.

create table public.stripe_webhook_events (
  id         uuid        primary key default gen_random_uuid(),
  event_id   text        not null unique,
  created_at timestamptz default now()
);

alter table public.stripe_webhook_events enable row level security;

-- Webhook handler uses service role key (createAdminClient) → RLS bypassed.
-- Deny all access from user JWTs as an extra safety layer.
create policy "deny all non-service-role" on public.stripe_webhook_events
  for all using (false) with check (false);
