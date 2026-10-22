-- Recorded audio for words and sentences (ElevenLabs). Each clip is made
-- once on the server and stored in the public `word-audio` bucket, at
-- words/<word id>.mp3 or sentences/<sentence id>.mp3. A null audio_path
-- means there's no clip yet, and the app uses the browser voice instead.

alter table public.words add column audio_path text
  constraint words_audio_path_check
  check (audio_path = 'words/' || id || '.mp3');

alter table public.word_sentences add column audio_path text
  constraint word_sentences_audio_path_check
  check (audio_path = 'sentences/' || id || '.mp3');

-- The server saves the path with the signed-in user's session, so members
-- can set audio_path and nothing else. The check constraints above mean the
-- only value it can take is the row's own clip.
create policy "Set word audio" on public.words
  for update to authenticated using (true) with check (true);
create policy "Set sentence audio" on public.word_sentences
  for update to authenticated using (true) with check (true);
grant update (audio_path) on public.words to authenticated;
grant update (audio_path) on public.word_sentences to authenticated;

-- Public read, so the drill can play a clip from a plain URL. The words
-- aren't secret. MP3 only, up to 1 MB (a word or sentence is ~20 to 80 KB).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('word-audio', 'word-audio', true, 1048576, array['audio/mpeg'])
on conflict (id) do nothing;

-- Members can add clips at the expected paths but not replace or delete
-- them, so a clip can't be swapped out from the browser.
create policy "Add word audio" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'word-audio'
    and name ~ '^(words|sentences)/[0-9a-f-]{36}\.mp3$'
  );
