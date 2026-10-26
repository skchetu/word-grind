-- Lets members rename their own household from Settings. The "Update own
-- household" policy already limits updates to the caller's household, and
-- difficulty was the only column granted until now.
grant update (name) on public.households to authenticated;
