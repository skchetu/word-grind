-- Gives every account a profile in the household as soon as it exists.
--
-- Clients can't insert profiles or households (see the table grants), so
-- this runs inside the database when Supabase Auth creates a user. Everyone
-- joins the oldest household; the first account creates it.

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  home uuid;
begin
  select id into home from public.households order by created_at limit 1;
  if home is null then
    insert into public.households (name) values ('Word Grind')
    returning id into home;
  end if;

  insert into public.profiles (id, household_id, display_name)
  values (new.id, home, split_part(new.email, '@', 1))
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Accounts created before this migration ran.
insert into public.households (name)
select 'Word Grind'
where not exists (select 1 from public.households);

insert into public.profiles (id, household_id, display_name)
select
  u.id,
  (select h.id from public.households h order by h.created_at limit 1),
  split_part(u.email, '@', 1)
from auth.users u
on conflict (id) do nothing;
