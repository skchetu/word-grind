-- Row-level security policies.
--
-- Everyone in a household can see each other's progress (the scoreboard is
-- shared), but each person can only write their own rows. The word bank is
-- readable by any signed-in user. Anonymous visitors have no grants at all.

-- The current user's household, looked up without going through RLS so that
-- policies on profiles don't recurse. Lives in a schema the Data API doesn't
-- expose, so it can't be called directly from the client.
create schema if not exists private;

create function private.my_household_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select household_id from public.profiles where id = (select auth.uid())
$$;

revoke all on function private.my_household_id() from public;
grant usage on schema private to authenticated;
grant execute on function private.my_household_id() to authenticated;

-- households: only your own.
create policy "Read own household" on public.households
  for select to authenticated
  using (id = (select private.my_household_id()));

-- profiles: read your household, edit only yourself. Moving to another
-- household isn't allowed from the client, so household_id isn't updatable.
create policy "Read household profiles" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or household_id = (select private.my_household_id()));

create policy "Update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke update on public.profiles from authenticated;
grant update (display_name, difficulty, topics, voice_uri, speech_rate)
  on public.profiles to authenticated;

-- words and word_sentences: the shared bank, readable by any signed-in user.
create policy "Read word bank" on public.words
  for select to authenticated using (true);

create policy "Read word sentences" on public.word_sentences
  for select to authenticated using (true);

-- weeks and week_words: your household's lists.
create policy "Read household weeks" on public.weeks
  for select to authenticated
  using (household_id = (select private.my_household_id()));

create policy "Read household week words" on public.week_words
  for select to authenticated
  using (exists (
    select 1 from public.weeks w
    where w.id = week_id and w.household_id = (select private.my_household_id())
  ));

-- review_state: read the household's (for "words mastered"), write your own.
create policy "Read household review state" on public.review_state
  for select to authenticated
  using (profile_id in (
    select p.id from public.profiles p
    where p.household_id = (select private.my_household_id())
  ));

create policy "Insert own review state" on public.review_state
  for insert to authenticated
  with check (profile_id = (select auth.uid()));

create policy "Update own review state" on public.review_state
  for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

-- sessions: read the household's (scoreboard), write your own, and only for
-- a week that belongs to your household.
create policy "Read household sessions" on public.sessions
  for select to authenticated
  using (profile_id in (
    select p.id from public.profiles p
    where p.household_id = (select private.my_household_id())
  ));

create policy "Insert own sessions" on public.sessions
  for insert to authenticated
  with check (
    profile_id = (select auth.uid())
    and exists (
      select 1 from public.weeks w
      where w.id = week_id and w.household_id = (select private.my_household_id())
    )
  );

create policy "Update own sessions" on public.sessions
  for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (
    profile_id = (select auth.uid())
    and exists (
      select 1 from public.weeks w
      where w.id = week_id and w.household_id = (select private.my_household_id())
    )
  );

-- attempts: read the household's ("most-missed words"), add to your own sessions.
create policy "Read household attempts" on public.attempts
  for select to authenticated
  using (exists (
    select 1 from public.sessions s
    join public.profiles p on p.id = s.profile_id
    where s.id = session_id and p.household_id = (select private.my_household_id())
  ));

create policy "Insert attempts in own sessions" on public.attempts
  for insert to authenticated
  with check (exists (
    select 1 from public.sessions s
    where s.id = session_id and s.profile_id = (select auth.uid())
  ));
