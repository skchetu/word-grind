-- Each person takes one Sunday test per week, whether on the Sunday or as a
-- make-up later, so the scoreboard has exactly one score per person per
-- week. Drills are unlimited.
--
-- Before the index exists, tests could be taken more than once. Only the
-- first test per person per week is kept; deleting a session also deletes
-- its attempts.

delete from public.sessions later
using public.sessions earlier
where later.kind = 'test'
  and earlier.kind = 'test'
  and later.profile_id = earlier.profile_id
  and later.week_id = earlier.week_id
  and (later.started_at, later.id) > (earlier.started_at, earlier.id);

create unique index sessions_one_test_per_week
  on public.sessions (profile_id, week_id)
  where kind = 'test';
