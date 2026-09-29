-- Chat read receipts ("seen") for both sides
alter table public.ra_chat_threads add column if not exists user_read_at timestamptz;
alter table public.ra_chat_threads add column if not exists admin_read_at timestamptz;

create or replace function public.ra_chat_mark_read()
 returns void language sql security definer set search_path to 'public'
as $$
  update public.ra_chat_threads set unread_user = 0, user_read_at = now() where user_id = auth.uid();
$$;

create or replace function public.ra_admin_chat_read(p_user uuid)
 returns void language plpgsql security definer set search_path to 'public'
as $$
begin
  if not public.ra_is_admin() then raise exception 'forbidden'; end if;
  update public.ra_chat_threads set unread_admin = 0, admin_read_at = now() where user_id = p_user;
end $$;

-- live updates of the thread row (so the other side sees "seen" instantly)
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ra_chat_threads') then
    alter publication supabase_realtime add table public.ra_chat_threads;
  end if;
end $$;
