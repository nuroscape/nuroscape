-- Grant table-level privileges to the service_role PostgreSQL role.
-- service_role bypasses RLS, but still needs base GRANT access.
-- These tables were created without explicit GRANTs and are inaccessible
-- from API routes that use createAdminClient() (service role key).

GRANT ALL ON TABLE public.stripe_webhook_events TO service_role;
GRANT ALL ON TABLE public.subscriptions         TO service_role;
GRANT ALL ON TABLE public.users                 TO service_role;
GRANT ALL ON TABLE public.assessments           TO service_role;

-- Sequences (needed for any SERIAL/generated columns in future tables)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
