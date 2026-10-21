-- Claude's mistake tips, cached by word and the normalized wrong spelling.
--
-- The same misspelling of the same word always gets the same tip, so it is
-- only ever paid for once, for everyone. Like the word bank, the cache is
-- shared and readable by any signed-in user. Signed-in users can add tips
-- (the server action does this after a Claude call) but not change them.

create table public.tip_cache (
  word_id uuid not null references public.words (id) on delete cascade,
  wrong text not null check (wrong = lower(btrim(wrong)) and wrong <> ''),
  tip text not null check (tip <> ''),
  created_at timestamptz not null default now(),
  primary key (word_id, wrong)
);

alter table public.tip_cache enable row level security;

create policy "Read tip cache" on public.tip_cache
  for select to authenticated using (true);

create policy "Add to tip cache" on public.tip_cache
  for insert to authenticated with check (true);

grant select, insert on public.tip_cache to authenticated;
grant all on public.tip_cache to service_role;
