# Decisions

Short entries for choices that aren't obvious from the code. Newest last.

## Pin Node 24 and pnpm through corepack
Node is pinned in `.nvmrc` and `engines`, and pnpm in `packageManager`. Local, CI and Vercel all run the same toolchain, so a lockfile or engine mismatch can't cause "works on my machine" failures.

## `noUncheckedIndexedAccess` on top of `strict`
Index access returns `T | undefined`. The core logic is index-heavy (letter alignment, Leitner boxes, the word queue), and this catches out-of-range bugs at compile time. Turning it on later would mean revisiting every call site.

## shadcn/ui over a full component library
Components are copied into the repo, so the drill screen can look distinctive and every line is ours to explain. Radix underneath provides focus management, keyboard support and ARIA. MUI or Mantine would be faster to start but heavier and harder to make look custom.

## Squash merging only
Each PR becomes one commit on `main`, titled with the PR title. History reads like a changelog, and reverting a feature is one `git revert`.

## Vitest in a Node environment for now
The first tests cover pure functions, which don't need a DOM. jsdom and Testing Library get added with the first interactive component.

## Explicit table grants instead of auto-exposing tables
New tables aren't exposed to Supabase's Data API automatically. Each migration grants only what the app needs: signed-in users can read shared content and write their own progress, word lists are written server-side with the service role, and anonymous visitors get nothing. A forgotten grant fails loudly, while a forgotten policy on an auto-exposed table would fail open.

## Invite-only magic links
Sign-in calls `signInWithOtp` with `shouldCreateUser: false`, new sign-ups are turned off in Supabase Auth, and both accounts are created from the Supabase dashboard. Turning sign-ups off matters because the publishable key is public, so anyone could call the sign-up API directly. The allowlist lives in Supabase rather than in code, so no email addresses end up in this public repo. The form shows the same "check your email" message for unknown addresses, so it can't be used to discover who has an account.

## Profiles are created by a database trigger
When Supabase Auth creates a user, a `security definer` trigger adds their profile and puts them in the oldest household, creating it if none exists. Doing it in the database means no code path can leave a signed-in user without a profile, and clients still never get insert rights on `profiles` or `households`. One shared household fits a two-person app; inviting someone into a specific household can replace this rule if the app ever hosts more than one.

## Leitner boxes over SM-2, with dates as strings
Five boxes with fixed intervals (1, 2, 4, 7 and 14 days) are easy to explain, test and show in the UI as a mastery level. SM-2 or FSRS would schedule more precisely but needs per-word ease factors that a weekly list of 15 words doesn't benefit from. Due dates are `YYYY-MM-DD` strings that match Postgres `date` columns, so time zones and daylight saving can never shift a review by a day.

## A typed reducer for the session flow, not XState
The drill is a state machine written as one pure `transition(state, event)` function over a discriminated union. The flow has five phases and a handful of events, so XState's actors, guards and visualizer would add a dependency and a learning curve without removing any code. The plain object state also serializes straight into `sessionStorage` for resume-after-refresh. If the flow grows parallel states (say, a timer running alongside audio), XState is the upgrade path.

## Weekly list: drop bad words and top up, fall back on API errors
`generateWeek` asks Claude (Opus 5.5 at low effort, structured output) for the list. Each card is validated on its own: a card that fails the schema or `checkCard` is dropped, and the rest are kept. If fewer than 12 remain, one more call asks for just the missing words, given the theme and the kept words. The first eval run needed a retry in 2 of 5 lists, and regenerating a whole list costs about 2,500 output tokens where replacing a word or two costs a few hundred, or nothing when 12 good words are left. An API error goes straight to a curated fallback week, because the SDK has already retried timeouts and rate limits. Either way the app always has a list.

## Weeks are saved through a database function, not the service role
`public.save_week` is a `security definer` function that signed-in users can call. It writes the week, any new words, their sentences and the week's word order in one transaction, always for the caller's household. The original plan was to write with the Supabase service role key. The function avoids handling a second, all-powerful secret, and it makes the save atomic, which four separate API inserts can't be. The cost is that a signed-in member could save a week by hand, which is acceptable for a two-person household.

## Weeks start on Monday, Los Angeles time
"This week" is the Monday on or before today's date in `America/Los_Angeles`, set once in `lib/week/dates.ts`. Using one household time zone, rather than the server's (UTC on Vercel) or each person's, means both people always see the same list. It also stops the week flipping over on Sunday evening.

## One difficulty level per household, nudged weekly
Both people get the same list and the same Sunday test, so difficulty lives on the household rather than on each profile. After each Sunday test, `adaptDifficulty` pools everyone's answers: 85% or more moves the level up one, 60% or less moves it down one, and anything between leaves it alone. Pooling answers (rather than averaging two scores) weights each word the same, and a one-step limit keeps a single bad week from swinging the list too far. A week where nobody took the test changes nothing.

## Every Claude call is logged with its tokens
Each call writes a row to `ai_calls` with the feature, model and token counts, including rejected attempts and calls that ended in a fallback, since those are billed too. The same table backs per-person daily limits, so there's no update or delete grant: a limit can't be reset from the browser. Logging failures are reported but don't block saving the week.

## Daily AI limits over a rolling 24 hours
Each AI feature has a per-person cap (`DAILY_LIMITS` in `lib/ai/limits.ts`), checked by counting that person's `ai_calls` rows from the last 24 hours. A rolling window needs no time zone maths and can't be reset by waiting for midnight. The caps sit well above normal use, so they only catch accidents such as a failing save that would otherwise call Claude again on every click. If the count itself fails, the call is refused rather than allowed.

## Mistake tips use Haiku and plain text
A tip is one sentence about one misspelling, so it uses Haiku 5.5 rather than Opus, which keeps each call fast and cheap. The reply is plain text checked with a small Zod schema (non-empty, at most 20 words) instead of structured output, since there's only one field. Any problem falls back to the word's saved mnemonic, so feedback never waits on Claude.

## One shared tip cache, keyed by the normalized misspelling
`tip_cache` is keyed by word and the misspelling after `normalize()`, so "Acommodate " and "acommodate" share one tip. Like the word bank it's shared across households, since a tip about a misspelling doesn't depend on who made it. Only Claude's tips are cached; a mnemonic fallback isn't, so the next miss gets another chance at a real tip. Signed-in users can add tips but not edit them, which is enough trust for an invite-only app.

## Speech logic lives outside the React hook
`createSpeaker` in `lib/speech/speaker.ts` wraps `speechSynthesis` as a small store: it queues the word and sentence with a pause, tracks `speaking`, filters to English voices and picks up voices that Chrome loads late. `useSpeech` only connects that store to React through `useSyncExternalStore`. The logic is tested in plain Node with a fake synth, so testing it needs no jsdom or React Testing Library. One speaker is shared per page, because the browser has a single speech queue.

## Recorded clips live at fixed paths in a public bucket
ElevenLabs clips are stored in the public `word-audio` bucket at `words/<id>.mp3` and `sentences/<id>.mp3`, and `audio_path` on each row says whether a clip exists. A check constraint ties `audio_path` to the row's own id, so it can only ever point at that row's clip, and signed-in members can set that one column and nothing else on the shared word bank. The bucket is public because the words aren't secret, which lets the drill play a plain URL with no signed-URL round trip. Members can add clips but not replace or delete them. As with weeks, this avoids handing the server a service-role key.

## ElevenLabs over plain fetch, not the SDK
`lib/speech/elevenlabs.ts` makes one POST per clip with `fetch`, since text-to-speech is the only ElevenLabs endpoint the app uses. That avoids adding the SDK and its dependencies for a single call, and MSW can mock it like the Claude API. Flash v2.5 is the cheapest, fastest model and sounds natural for single words and short sentences. A missing key or voice ID returns null, and the app keeps using the browser voice, so ElevenLabs stays optional.

## Clips are recorded after the response, two at a time
A new week has 30 clips (each word plus its two sentences). `generateThisWeek` saves the list, then hands the recording to Next's `after()`, so the list appears right away instead of after another 20 seconds. Two clips are made at once, half the free plan's limit of four for Flash, so a backfill or a second run can overlap without hitting rate limits. Speed hardly matters because nobody waits on it. A clip that fails is skipped, leaving that word on the browser voice. Clip calls aren't logged in `ai_calls`: they only happen when a week is made, which is already capped at three a day, and the API key has its own monthly credit limit.

## Drill answers are graded again on the server
The drill screen grades each answer so it can show feedback right away, but it only sends what was typed when saving. `drillRecords` in `lib/session/records.ts` grades every answer again against the stored word before writing the session, its attempts and each word's next Leitner box. A browser can't mark a misspelling as correct or move a word to a higher box than it earned, and the scoreboard depends on those numbers. Answer times are capped at an hour so a tab left open overnight doesn't distort the averages. Tests are saved the same way. `testAnswers` lines the answers up with the week's whole list, dropping extra or repeated words and counting any missing word as a blank, so a test's total is always the size of that week's list.

## Ten words a week, cut from larger fallback pools
Every weekly list and Sunday test has exactly `WORDS_PER_WEEK` (10) words, so scores compare fairly across weeks and a test fits easily inside the hour. If Claude's list is short after dropping bad words, only the missing words are requested. Each fallback list is a themed pool of at least 10 words (currently 15). `fallbackWeek` rotates through the pools and starts 10 words further into a pool on each pass, wrapping around, so repeated outages don't serve the same 10 words.

## A missed Sunday test stays open as a make-up
A week's test opens on its Sunday and stays open until it's taken, using that week's words and the same one-hour clock. `pendingTests` in `lib/week/pending-tests.ts` works this out from the weeks and the tests already taken, so nothing has to run on a schedule to mark a test as missed. A partial unique index on `sessions (profile_id, week_id) where kind = 'test'` lets the database, not just the UI, enforce one test per person per week, so a second tab or a double submit can't add a second score.

## Streaks count days of practice, not test weeks
A streak is the number of days in a row (in the household's time zone) with at least one finished drill or test. A streak that reached yesterday stays alive until today ends, so it never shows as broken before you've had a chance to practise. Daily practice is where spaced repetition does its work, so that's the habit the streak rewards; the weekly test already has the scoreboard. `currentStreak` in `lib/scoreboard/streak.ts` works from finished sessions, so nothing has to run at midnight to reset it.

## Most-missed words cover the last 30 days
The scoreboard lists each person's three most-missed words, counting wrong answers from drills and tests in the last 30 days. A rolling window shows what's hard right now, so a word drops off once you've learned it instead of staying on the list for good. Only wrong answers are fetched, which keeps the query small and well under the Data API's row limit.

## A returning word gets a new sentence, and keeps only its newest three
Each time a word comes back for review, the server asks Claude for a new example sentence (one call for all of the day's returning words), and the drill shows it. Only the three newest sentences per word are kept; older ones are deleted, along with their recorded clips, so the word bank doesn't grow with every review. A row-level security policy only allows deleting a sentence once its word has three newer ones, so the limit holds in the database and not just in the app. Newness comes from `created_at`, so no "last shown" column is needed: the newest sentence is always the one being shown.
