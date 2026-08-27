create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  paddle_customer_id text,
  paddle_transaction_id text not null unique,
  paddle_order_id text,
  product_id text not null,
  price_id text not null,
  status text not null default 'completed',
  amount integer not null,
  currency text not null,
  environment text not null default 'sandbox',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_purchases_user_id on public.purchases(user_id);
create index idx_purchases_transaction_id on public.purchases(paddle_transaction_id);

GRANT SELECT ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;

alter table public.purchases enable row level security;

create policy "Users can view own purchases"
  on public.purchases for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Service role can manage purchases"
  on public.purchases for all
  to service_role
  using (true);

create or replace function public.has_pro_access(
  user_uuid uuid,
  check_env text default 'live'
)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.purchases
    where user_id = user_uuid
    and environment = check_env
    and status in ('completed', 'paid')
  );
$$;