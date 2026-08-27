CREATE TABLE public.agent_credits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits integer NOT NULL DEFAULT 0,
  used integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.agent_credits TO authenticated;
GRANT ALL ON public.agent_credits TO service_role;

ALTER TABLE public.agent_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own analyst credits"
  ON public.agent_credits FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages analyst credits"
  ON public.agent_credits FOR ALL TO service_role
  USING (true) WITH CHECK (true);