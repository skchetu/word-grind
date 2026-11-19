-- A one-line query the /api/health route can run without signing in, so an
-- uptime monitor notices when the database is paused or unreachable. It reads
-- no tables, so letting signed-out callers run it exposes nothing.
create function public.health_check()
returns boolean
language sql
stable
set search_path = ''
as $$ select true $$;

revoke execute on function public.health_check() from public;
grant execute on function public.health_check() to anon, authenticated;
