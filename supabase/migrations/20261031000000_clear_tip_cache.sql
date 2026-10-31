-- Tips written before the tip prompt was given the exact mistakes could get
-- letter counts wrong ("vacuum has three u's"). Clearing the cache means
-- every misspelling gets a fresh tip from the new prompt on its next miss.
delete from public.tip_cache;
