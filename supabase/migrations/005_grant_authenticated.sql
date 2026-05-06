-- Grant SELECT on user-readable tables to the authenticated role.
-- Without this, server components reading via cookies-based Supabase client
-- get "permission denied for table" (error 42501) BEFORE RLS is even evaluated.
-- RLS policies handle row-level filtering; GRANT handles table-level access.

GRANT SELECT ON public.assessments TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.users TO authenticated;