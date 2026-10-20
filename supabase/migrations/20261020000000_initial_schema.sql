-- Initial schema: households, profiles, the shared word bank, weekly lists,
-- spaced-repetition state, and drill/test sessions with their attempts.
--
-- New tables are not exposed to the Data API automatically in this project,
-- so each table grants exactly what the app needs. RLS is enabled on every
-- table; the policies come in the next migration, and until then signed-in
-- users can't read or write any rows.

create extension if not exists citext with schema extensions;

-- People who share word lists and a scoreboard.
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  household_id uuid references public.households (id) on delete set null,
  display_name text not null,
  difficulty smallint not null default 3 check (difficulty between 1 and 5),
  topics text[] not null default '{}',
  voice_uri text,
  speech_rate real not null default 0.9 check (speech_rate between 0.5 and 2),
  created_at timestamptz not null default now()
);
create index profiles_household_id_idx on public.profiles (household_id);

-- Global word bank. AI-generated content is stored once and reused.
create table public.words (
  id uuid primary key default gen_random_uuid(),
  text extensions.citext not null unique,
  part_of_speech text not null,
  definition text not null,
  ipa text not null,
  syllables text[] not null default '{}',
  origin text not null,
  mnemonic text not null,
  difficulty smallint not null check (difficulty between 1 and 5),
  created_at timestamptz not null default now()
);

create table public.word_sentences (
  id uuid primary key default gen_random_uuid(),
  word_id uuid not null references public.words (id) on delete cascade,
  sentence text not null,
  cloze text not null, -- the same sentence with the word replaced by ______
  created_at timestamptz not null default now()
);
create index word_sentences_word_id_idx on public.word_sentences (word_id);

-- One list per household per week.
create table public.weeks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  starts_on date not null,
  theme text not null,
  status text not null default 'active' check (status in ('active', 'closed')),
  created_at timestamptz not null default now(),
  unique (household_id, starts_on)
);

create table public.week_words (
  week_id uuid not null references public.weeks (id) on delete cascade,
  word_id uuid not null references public.words (id) on delete restrict,
  position smallint not null,
  primary key (week_id, word_id),
  unique (week_id, position)
);

-- Leitner state, one row per person per word.
create table public.review_state (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  word_id uuid not null references public.words (id) on delete cascade,
  box smallint not null default 1 check (box between 1 and 5),
  due_on date not null default current_date,
  correct_streak integer not null default 0 check (correct_streak >= 0),
  lapses integer not null default 0 check (lapses >= 0),
  primary key (profile_id, word_id)
);
-- The daily drill asks "which of my words are due today?"
create index review_state_due_idx on public.review_state (profile_id, due_on);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  week_id uuid not null references public.weeks (id) on delete cascade,
  kind text not null check (kind in ('drill', 'test')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  score smallint check (score >= 0),
  total smallint check (total >= 0),
  check (score <= total)
);
create index sessions_profile_id_idx on public.sessions (profile_id, started_at desc);
create index sessions_week_id_idx on public.sessions (week_id);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  word_id uuid not null references public.words (id) on delete cascade,
  typed text not null,
  correct boolean not null,
  edit_distance smallint not null check (edit_distance >= 0),
  used_hint boolean not null default false,
  ms_to_answer integer not null check (ms_to_answer >= 0),
  created_at timestamptz not null default now()
);
create index attempts_session_id_idx on public.attempts (session_id);
create index attempts_word_id_idx on public.attempts (word_id);

-- RLS on everything (the project also enables it by default).
alter table public.households enable row level security;
alter table public.profiles enable row level security;
alter table public.words enable row level security;
alter table public.word_sentences enable row level security;
alter table public.weeks enable row level security;
alter table public.week_words enable row level security;
alter table public.review_state enable row level security;
alter table public.sessions enable row level security;
alter table public.attempts enable row level security;

-- Signed-in users: read shared content, write only their own progress.
-- Word lists are generated and saved on the server with the service role.
-- Anonymous visitors get nothing.
grant select on public.households, public.words, public.word_sentences,
  public.weeks, public.week_words to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.review_state, public.sessions to authenticated;
grant select, insert on public.attempts to authenticated;

grant all on all tables in schema public to service_role;
