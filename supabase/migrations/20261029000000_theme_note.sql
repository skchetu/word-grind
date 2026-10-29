-- A plain-English line explaining each week's theme, shown beside the
-- theme on Home. Weeks made before this stay null and show no explainer.

alter table public.weeks
  add column theme_note text check (char_length(theme_note) <= 300);

-- Written after save_week, like difficulty; the existing "Set household
-- week level" policy already limits updates to the household's own weeks.
grant update (theme_note) on public.weeks to authenticated;
