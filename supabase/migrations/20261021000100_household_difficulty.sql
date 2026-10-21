-- Difficulty moves from each profile to the household.
--
-- Everyone in a household gets the same weekly list and Sunday test, so
-- there is one shared level (1 to 5). The weekly adaptive rule
-- (lib/difficulty/adapt.ts) nudges it, and either member can change it.

alter table public.households
  add column difficulty smallint not null default 3
  check (difficulty between 1 and 5);

-- Carry over what people had already picked: the rounded average of the
-- household's profiles.
update public.households h
set difficulty = sub.level
from (
  select household_id, round(avg(difficulty))::smallint as level
  from public.profiles
  where household_id is not null
  group by household_id
) sub
where sub.household_id = h.id;

-- Dropping the column also drops its column-level update grant.
alter table public.profiles drop column difficulty;

-- Members can change their own household's level, and nothing else on it.
create policy "Update own household" on public.households
  for update to authenticated
  using (id = (select private.my_household_id()))
  with check (id = (select private.my_household_id()));

grant update (difficulty) on public.households to authenticated;
