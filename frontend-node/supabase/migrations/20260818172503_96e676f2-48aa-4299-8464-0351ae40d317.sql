CREATE TABLE public.anon_analyst_usage (
  session_id UUID PRIMARY KEY,
  turns INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.anon_analyst_usage TO service_role;
ALTER TABLE public.anon_analyst_usage ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.phone_otp (
  phone TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 1,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.phone_otp TO service_role;
ALTER TABLE public.phone_otp ENABLE ROW LEVEL SECURITY;