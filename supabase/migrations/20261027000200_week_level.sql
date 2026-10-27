-- Each week remembers the difficulty level its list was written for, so
-- the recap can show how the level moved ("Next week: level 4, up from 3").
-- Weeks made before this stay null.

alter table public.weeks
  add column difficulty smallint check (difficulty between 1 and 5);

-- Members can set the level on their own household's weeks, and nothing
-- else on them; everything else is written by save_week.
create policy "Set household week level" on public.weeks
  for update to authenticated
  using (household_id = (select private.my_household_id()))
  with check (household_id = (select private.my_household_id()));

grant update (difficulty) on public.weeks to authenticated;
