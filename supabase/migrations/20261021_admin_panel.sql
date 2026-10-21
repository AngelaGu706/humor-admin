-- Run once in the SQL editor of the EXISTING hello-world-week2 project.
-- Existing content and ordinary-user policies are retained.
begin;

alter table public.profiles add column if not exists is_superadmin boolean not null default false;

create or replace function public.week6_protect_admin_flag()
returns trigger language plpgsql set search_path = '' as $$
begin
  -- Profile editing must never allow a browser/API user to promote an account,
  -- including when an existing signup trigger runs as a privileged owner.
  if (select auth.role()) in ('anon', 'authenticated') then
    if TG_OP = 'INSERT' then
      if coalesce(NEW.is_superadmin, false) then
        raise exception 'Administrator roles can only be assigned by the database owner';
      end if;
    elsif NEW.is_superadmin is distinct from OLD.is_superadmin then
      raise exception 'Administrator roles can only be assigned by the database owner';
    end if;
  end if;
  return NEW;
end;
$$;
drop trigger if exists week6_protect_admin_flag on public.profiles;
create trigger week6_protect_admin_flag before insert or update on public.profiles
  for each row execute function public.week6_protect_admin_flag();

-- Definer avoids recursive profiles RLS; there is no caller-supplied user ID.
create or replace function public.week6_is_superadmin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = (select auth.uid()) and is_superadmin = true);
$$;
revoke all on function public.week6_is_superadmin() from public, anon;
grant execute on function public.week6_is_superadmin() to authenticated;

alter table public.profiles enable row level security;
alter table public.generations enable row level security;
alter table public.votes enable row level security;

drop policy if exists "Week6 admins read profiles" on public.profiles;
create policy "Week6 admins read profiles" on public.profiles for select to authenticated
  using ((select public.week6_is_superadmin()));
drop policy if exists "Week6 admins read generations" on public.generations;
create policy "Week6 admins read generations" on public.generations for select to authenticated
  using ((select public.week6_is_superadmin()));
drop policy if exists "Week6 admins create generations" on public.generations;
create policy "Week6 admins create generations" on public.generations for insert to authenticated
  with check ((select public.week6_is_superadmin()));
drop policy if exists "Week6 admins update generations" on public.generations;
create policy "Week6 admins update generations" on public.generations for update to authenticated
  using ((select public.week6_is_superadmin())) with check ((select public.week6_is_superadmin()));
drop policy if exists "Week6 admins delete generations" on public.generations;
create policy "Week6 admins delete generations" on public.generations for delete to authenticated
  using ((select public.week6_is_superadmin()));
drop policy if exists "Week6 admins read votes" on public.votes;
create policy "Week6 admins read votes" on public.votes for select to authenticated
  using ((select public.week6_is_superadmin()));

grant select on public.profiles, public.votes to authenticated;
grant select, insert, update, delete on public.generations to authenticated;

create or replace function public.week6_pick_area(value text)
returns text language plpgsql immutable set search_path = '' as $$
declare parsed jsonb;
begin
  parsed := value::jsonb;
  if parsed->>'format' = 'nyc-food-pick-v1' then
    return nullif(trim(parsed->>'area'), '');
  end if;
  return null;
exception when invalid_text_representation then return null;
end;
$$;
revoke all on function public.week6_pick_area(text) from public, anon;
grant execute on function public.week6_pick_area(text) to authenticated;

-- Aggregates run in SQL across the full dataset, without a 1,000-row API cap.
-- Invoker security retains RLS even if the caller invokes this RPC directly.
create or replace function public.week6_admin_statistics()
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare result jsonb;
begin
  if not public.week6_is_superadmin() then raise insufficient_privilege using message = 'Administrator access required'; end if;
  select jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'media', (select count(*) from public.generations),
    'votes', (select count(*) from public.votes),
    'up', (select count(*) from public.votes where vote = 'up'),
    'down', (select count(*) from public.votes where vote = 'down'),
    'days', (select coalesce(jsonb_agg(to_jsonb(d) order by d.day), '[]'::jsonb) from (
      select to_char(day, 'YYYY-MM-DD') as day, count(g.id) as count
      from generate_series((now() at time zone 'UTC')::date - 13, (now() at time zone 'UTC')::date, interval '1 day') as series(day)
      left join public.generations g on (g.created_at at time zone 'UTC')::date = day::date
      group by day
    ) d),
    'top', (select coalesce(jsonb_agg(to_jsonb(t) order by t.up desc, (t.up - t.down) desc, t.id), '[]'::jsonb) from (
      select g.id, g.title, count(*) filter (where v.vote = 'up') as up, count(*) filter (where v.vote = 'down') as down
      from public.generations g join public.votes v on v.generation_id = g.id group by g.id, g.title
      order by up desc, (count(*) filter (where v.vote = 'up') - count(*) filter (where v.vote = 'down')) desc, g.id limit 5
    ) t),
    'neighborhoods', (select coalesce(jsonb_agg(to_jsonb(n) order by n.count desc, n.name), '[]'::jsonb) from (
      select public.week6_pick_area(content) as name, count(*) as count from public.generations
      where public.week6_pick_area(content) is not null group by public.week6_pick_area(content)
      order by count desc, name limit 5
    ) n)
  ) into result;
  return result;
end;
$$;
revoke all on function public.week6_admin_statistics() from public, anon;
grant execute on function public.week6_admin_statistics() to authenticated;

-- Installed last, so the app stays closed until the whole transaction succeeds.
create or replace function public.week6_admin_ready()
returns boolean language sql stable security invoker set search_path = '' as $$
  select public.week6_is_superadmin();
$$;
revoke all on function public.week6_admin_ready() from public, anon;
grant execute on function public.week6_admin_ready() to authenticated;

commit;

-- Separately, the database owner can promote ONE verified existing account:
-- update public.profiles set is_superadmin = true where id = '<YOUR_AUTH_USER_UUID>';
