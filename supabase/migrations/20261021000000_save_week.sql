-- Saves a generated week for the caller's household in one transaction.
--
-- Signed-in users can only read the word bank and weeks (see the table
-- grants), so writes go through this function instead. Running inside the
-- database keeps the four inserts atomic: a failure halfway leaves nothing
-- behind. It always writes to the caller's own household.
--
-- p_week is the validated week from lib/ai, with each sentence already
-- paired with its fill-in-the-blank version:
--   { "theme": "...", "words": [{ "word": "...", ..., "sentences":
--     [{ "sentence": "...", "cloze": "..." }] }] }
--
-- Words already in the bank keep their saved content and sentences, so each
-- word is generated once. If the household already has a week starting on
-- p_starts_on, that week wins and its id is returned unchanged.

create function public.save_week(p_starts_on date, p_week jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_home uuid := private.my_household_id();
  v_week_id uuid;
  v_word_id uuid;
  v_card jsonb;
  v_position smallint := 0;
begin
  if v_home is null then
    raise exception 'save_week: no household for the current user';
  end if;

  insert into public.weeks (household_id, starts_on, theme)
  values (v_home, p_starts_on, p_week ->> 'theme')
  on conflict (household_id, starts_on) do nothing
  returning id into v_week_id;

  if v_week_id is null then
    select id into v_week_id from public.weeks
    where household_id = v_home and starts_on = p_starts_on;
    return v_week_id;
  end if;

  for v_card in select * from jsonb_array_elements(p_week -> 'words') loop
    v_position := v_position + 1;

    insert into public.words (text, part_of_speech, definition, ipa,
      syllables, origin, mnemonic, difficulty)
    values (
      v_card ->> 'word',
      v_card ->> 'partOfSpeech',
      v_card ->> 'definition',
      v_card ->> 'ipa',
      array(select jsonb_array_elements_text(v_card -> 'syllables')),
      v_card ->> 'origin',
      v_card ->> 'mnemonic',
      (v_card ->> 'difficulty')::smallint
    )
    on conflict (text) do nothing
    returning id into v_word_id;

    if v_word_id is null then
      select id into v_word_id from public.words
      where text = (v_card ->> 'word')::extensions.citext;
    else
      insert into public.word_sentences (word_id, sentence, cloze)
      select v_word_id, s ->> 'sentence', s ->> 'cloze'
      from jsonb_array_elements(v_card -> 'sentences') as s;
    end if;

    insert into public.week_words (week_id, word_id, position)
    values (v_week_id, v_word_id, v_position);
  end loop;

  return v_week_id;
end;
$$;

revoke execute on function public.save_week(date, jsonb) from public, anon;
grant execute on function public.save_week(date, jsonb) to authenticated;
