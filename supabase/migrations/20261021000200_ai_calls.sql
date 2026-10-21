-- One row per Claude call the app makes, with its token usage.
--
-- Two uses: real cost numbers for the README, and per-person daily limits
-- on the AI features (each limit counts this person's rows for a feature
-- since the start of the day). People can add rows for themselves and read
-- their household's; there's no update or delete, so a limit can't be
-- reset from the client.

create table public.ai_calls (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  feature text not null check (feature in ('week', 'tip', 'sentences', 'recap')),
  model text not null,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  created_at timestamptz not null default now()
);
create index ai_calls_profile_id_created_at_idx
  on public.ai_calls (profile_id, created_at);

alter table public.ai_calls enable row level security;

create policy "Read household AI calls" on public.ai_calls
  for select to authenticated
  using (profile_id in (
    select p.id from public.profiles p
    where p.household_id = (select private.my_household_id())
  ));

create policy "Log own AI calls" on public.ai_calls
  for insert to authenticated
  with check (profile_id = (select auth.uid()));

grant select, insert on public.ai_calls to authenticated;
grant all on public.ai_calls to service_role;
