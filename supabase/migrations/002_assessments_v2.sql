-- ─── Nuroscape — Assessments v2 ─────────────────────────────────────────────
-- Replaces auth-gated assessments with anonymous session-based flow.
-- session_id acts as the anonymous token through the pre-payment funnel.

DROP TABLE IF EXISTS public.assessments CASCADE;

CREATE TABLE public.assessments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  responses   JSONB       NOT NULL DEFAULT '{}',
  scores      JSONB       NOT NULL DEFAULT '{}',
  report      JSONB,
  paid        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX assessments_session_id_idx ON public.assessments (session_id);
CREATE INDEX assessments_user_id_idx    ON public.assessments (user_id);

-- RLS enabled — no public policies; service_role bypasses RLS
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Users can read their own assessments after payment links user_id
CREATE POLICY "assessments: select own"
  ON public.assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE TRIGGER assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
