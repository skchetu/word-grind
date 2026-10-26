-- Fresh example sentences. Each time a word comes back for review, the
-- server asks Claude for a new sentence, saves it with the signed-in user's
-- session, and deletes the word's older sentences so only the three newest
-- remain.

create policy "Add word sentences" on public.word_sentences
  for insert to authenticated with check (true);
grant insert (word_id, sentence, cloze) on public.word_sentences to authenticated;

-- A sentence can only be deleted once the word has three newer ones, so
-- the database, not just the app, keeps each word's latest three.
create policy "Prune old word sentences" on public.word_sentences
  for delete to authenticated
  using (
    (select count(*) from public.word_sentences newer
     where newer.word_id = word_sentences.word_id
       and newer.created_at > word_sentences.created_at) >= 3
  );
grant delete on public.word_sentences to authenticated;

-- A pruned sentence's clip can then be removed too. Only clips whose
-- sentence is gone can be deleted, so a clip in use can't be swapped out.
-- Storage needs read access to find an object before deleting it, and the
-- bucket is public anyway.
create policy "Read word audio" on storage.objects
  for select to authenticated
  using (bucket_id = 'word-audio');

create policy "Remove pruned sentence audio" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'word-audio'
    and storage.objects.name ~ '^sentences/[0-9a-f-]{36}\.mp3$'
    and not exists (
      select 1 from public.word_sentences s
      where s.audio_path = storage.objects.name
    )
  );
