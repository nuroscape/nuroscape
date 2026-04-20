-- ─── Nuroscape — Initial schema ───────────────────────────────────────────
-- Run once on a fresh Supabase project.

-- ─── Users ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       TEXT        NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Assessments ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assessments (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status                TEXT        NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  responses             JSONB       NOT NULL DEFAULT '[]',
  score_inattention     INTEGER     CHECK (score_inattention BETWEEN 0 AND 27),
  score_hyperactivity   INTEGER     CHECK (score_hyperactivity BETWEEN 0 AND 27),
  score_total           INTEGER     CHECK (score_total BETWEEN 0 AND 54),
  report_html           TEXT,
  report_generated_at   TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assessments_user_id_idx ON public.assessments (user_id);

-- ─── Subscriptions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                        UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID  NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id        TEXT  NOT NULL,
  stripe_subscription_id    TEXT,
  stripe_payment_intent_id  TEXT,
  status                    TEXT  NOT NULL DEFAULT 'trialing'
                              CHECK (status IN ('trialing', 'active', 'canceled', 'past_due', 'incomplete')),
  plan                      TEXT  NOT NULL DEFAULT 'trial'
                              CHECK (plan IN ('trial', 'monthly')),
  trial_ends_at             TIMESTAMPTZ,
  current_period_end        TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- ─── RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions  ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "users: select own"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users: update own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Assessments policies
CREATE POLICY "assessments: select own"
  ON public.assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "assessments: insert own"
  ON public.assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "assessments: update own"
  ON public.assessments FOR UPDATE
  USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "subscriptions: select own"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- ─── Auto-create user profile on sign-up ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── updated_at trigger ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
