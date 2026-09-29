-- v2: any provider (official Claude or any OpenAI-compatible service that offers Claude)
create or replace function public.ra_admin_ai_status()
returns jsonb language plpgsql security definer set search_path = public as $$
declare k text; m text; u timestamptz; p text; b text;
begin
  if not public.ra_is_admin() then raise exception 'forbidden'; end if;
  select value, updated_at into k, u from public.ra_secrets where key = 'anthropic_api_key';
  select value into m from public.ra_secrets where key = 'anthropic_model';
  select value into p from public.ra_secrets where key = 'ai_provider';
  select value into b from public.ra_secrets where key = 'ai_base_url';
  return jsonb_build_object('set', k is not null, 'hint', case when k is null then null else right(k, 4) end,
                            'updated_at', u, 'model', coalesce(m, 'claude-opus-5-5'),
                            'provider', coalesce(p, 'anthropic'), 'base_url', coalesce(b, ''));
end $$;

drop function if exists public.ra_admin_set_ai(text, text, boolean);
create or replace function public.ra_admin_set_ai(p_key text default null, p_model text default null, p_clear boolean default false,
                                                  p_provider text default null, p_base_url text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.ra_is_admin() then raise exception 'forbidden'; end if;
  if p_clear then delete from public.ra_secrets where key = 'anthropic_api_key'; end if;
  if p_key is not null and length(btrim(p_key)) > 0 then
    if length(btrim(p_key)) < 16 or length(btrim(p_key)) > 400 or btrim(p_key) ~ '\s' then raise exception 'bad_key'; end if;
    insert into public.ra_secrets(key, value, updated_at) values ('anthropic_api_key', btrim(p_key), now())
      on conflict (key) do update set value = excluded.value, updated_at = now();
  end if;
  if p_model is not null and btrim(p_model) ~ '^[A-Za-z0-9._:/@-]{2,100}$' then
    insert into public.ra_secrets(key, value, updated_at) values ('anthropic_model', btrim(p_model), now())
      on conflict (key) do update set value = excluded.value, updated_at = now();
  end if;
  if p_provider in ('anthropic', 'openai') then
    insert into public.ra_secrets(key, value, updated_at) values ('ai_provider', p_provider, now())
      on conflict (key) do update set value = excluded.value, updated_at = now();
  end if;
  if p_base_url is not null then
    if btrim(p_base_url) = '' then delete from public.ra_secrets where key = 'ai_base_url';
    elsif btrim(p_base_url) ~ '^https://[A-Za-z0-9.-]+\.[A-Za-z]{2,}(:[0-9]{2,5})?(/[A-Za-z0-9._~/-]*)?$' then
      insert into public.ra_secrets(key, value, updated_at) values ('ai_base_url', rtrim(btrim(p_base_url), '/'), now())
        on conflict (key) do update set value = excluded.value, updated_at = now();
    else raise exception 'bad_url'; end if;
  end if;
  return public.ra_admin_ai_status();
end $$;

revoke all on function public.ra_admin_set_ai(text, text, boolean, text, text) from public, anon;
grant execute on function public.ra_admin_set_ai(text, text, boolean, text, text) to authenticated;
