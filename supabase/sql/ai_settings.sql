-- Claude API key + model for the admin assistant, saved from the admin panel.
-- The key is never readable from the browser: no RLS policies, only the Edge Function (service role) reads it.
create table if not exists public.ra_secrets (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table public.ra_secrets enable row level security;
revoke all on table public.ra_secrets from anon, authenticated;

create or replace function public.ra_admin_ai_status()
returns jsonb language plpgsql security definer set search_path = public as $$
declare k text; m text; u timestamptz;
begin
  if not public.ra_is_admin() then raise exception 'forbidden'; end if;
  select value, updated_at into k, u from public.ra_secrets where key = 'anthropic_api_key';
  select value into m from public.ra_secrets where key = 'anthropic_model';
  return jsonb_build_object('set', k is not null, 'hint', case when k is null then null else right(k, 4) end,
                            'updated_at', u, 'model', coalesce(m, 'claude-opus-5-5'));
end $$;

create or replace function public.ra_admin_set_ai(p_key text default null, p_model text default null, p_clear boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.ra_is_admin() then raise exception 'forbidden'; end if;
  if p_clear then delete from public.ra_secrets where key = 'anthropic_api_key'; end if;
  if p_key is not null and length(btrim(p_key)) > 0 then
    if length(btrim(p_key)) < 20 or length(btrim(p_key)) > 400 or btrim(p_key) ~ '\s' then raise exception 'bad_key'; end if;
    insert into public.ra_secrets(key, value, updated_at) values ('anthropic_api_key', btrim(p_key), now())
      on conflict (key) do update set value = excluded.value, updated_at = now();
  end if;
  if p_model is not null and btrim(p_model) ~ '^claude-[a-z0-9.-]{3,60}$' then
    insert into public.ra_secrets(key, value, updated_at) values ('anthropic_model', btrim(p_model), now())
      on conflict (key) do update set value = excluded.value, updated_at = now();
  end if;
  return public.ra_admin_ai_status();
end $$;

revoke all on function public.ra_admin_ai_status() from public, anon;
revoke all on function public.ra_admin_set_ai(text, text, boolean) from public, anon;
grant execute on function public.ra_admin_ai_status() to authenticated;
grant execute on function public.ra_admin_set_ai(text, text, boolean) to authenticated;
