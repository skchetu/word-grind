-- Claude's recap of a week, written once both people have taken that
-- week's Sunday test: a headline, the spelling patterns both struggled
-- with, and what next week's list should focus on. One row per week (the
-- primary key), so a second attempt to save it is refused.

create table public.week_recaps (
  week_id uuid primary key references public.weeks (id) on delete cascade,
  headline text not null check (headline <> ''),
  shared_patterns text[] not null default '{}',
  next_week_focus text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.week_recaps enable row level security;

-- Members read and add recaps for their own household's weeks. The server
-- adds the recap with the signed-in user's session; there's no update or
-- delete.
create policy "Read household recaps" on public.week_recaps
  for select to authenticated
  using (exists (
    select 1 from public.weeks w
    where w.id = week_id and w.household_id = (select private.my_household_id())
  ));

create policy "Add household recaps" on public.week_recaps
  for insert to authenticated
  with check (exists (
    select 1 from public.weeks w
    where w.id = week_id and w.household_id = (select private.my_household_id())
  ));

grant select, insert on public.week_recaps to authenticated;
grant all on public.week_recaps to service_role;
