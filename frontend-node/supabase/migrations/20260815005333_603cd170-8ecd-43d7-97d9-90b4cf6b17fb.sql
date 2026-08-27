create or replace function public.has_pro_access(
  user_uuid uuid,
  check_env text default 'live'
)
returns boolean language sql security invoker set search_path = public as $$
  select exists (
    select 1 from public.purchases
    where user_id = user_uuid
    and environment = check_env
    and status in ('completed', 'paid')
  );
$$;

revoke execute on function public.has_pro_access(uuid, text) from anon;