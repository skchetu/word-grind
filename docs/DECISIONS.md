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
A new week has 40 clips (each word plus its three sentences). `generateThisWeek` saves the list, then hands the recording to Next's `after()`, so the list appears right away instead of after another 20 seconds. Two clips are made at once, half the free plan's limit of four for Flash, so a backfill or a second run can overlap without hitting rate limits. Speed hardly matters because nobody waits on it. A clip that fails is skipped, leaving that word on the browser voice. Clip calls aren't logged in `ai_calls`: they only happen when a week is made, which is already capped at three a day, and the API key has its own monthly credit limit.

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

## Every word gets three sentences up front
Claude writes three example sentences per word when the weekly list is made, and all three are recorded straight away, so nothing waits on a drill. Backup-list words and words saved before this have two, so right after a list is saved (in `after()`), any week word with fewer than three gets one more from Claude Haiku before the clips are recorded. The drill does the same for a returning word from an older week, once. No sentences are made after that. An earlier version made a new sentence on every review and deleted the oldest, but those daily sentences never had recorded clips: recording each one would have cost more ElevenLabs credits than the free plan allows, and on iPhone the browser voice that read them is easy to block. The row-level security policy that allows deleting a sentence once its word has three newer ones stays, though nothing uses it now.

## The level moves when Monday's list is made
Adaptive difficulty runs as part of generating the week's list, not on a schedule or when a test finishes. `nextHouseholdLevel` in `app/household-level.ts` totals every answer from last week's Sunday tests (so one person skipping still counts the other's answers), and the new list is written for the adapted level. The new level is only saved after the list saves, so a failed save followed by a retry can't move the level twice. A test made up after Monday doesn't move that week's level.

## Migrations apply themselves on merge
`.github/workflows/migrations.yml` runs `supabase db push` whenever a file in `supabase/migrations` reaches `main`. The CLI keeps a list of applied migrations in the database and only runs new ones, so the schema in the repo and the live database can't drift apart because someone forgot to paste a file. It runs only after merge, never on a PR, so an unreviewed migration never touches production. The CLI version is pinned so a CLI release can't change how migrations are applied without a PR.

## The theme is saved per device
Light, dark or "match this device" is stored in `localStorage`, not on the profile, because the same person may want dark on their phone at night and light on a laptop. A tiny script in `<head>` adds the `light` or `dark` class before the page paints, so a saved theme never flashes the other one first. Tailwind's `dark:` variant and the colour tokens both follow that class, and fall back to the system setting when neither class is set.

## The week's list is made on the first visit, not by a scheduled job
When the home page finds no list for this week, it starts making one straight away and shows "Writing this week's list…" until it's ready. A scheduled job would have the list waiting before anyone opens the app, but it runs with no signed-in user, so it would need the Supabase service-role key (which skips row-level security) on the server, plus a separate save path for it. For two people, waiting about a minute once a week is a better trade than holding a key that can read every household. If both people open the app at the same moment, the unique `(household_id, starts_on)` on `weeks` keeps one list.

## Tabs on laptops, a floating menu button on phones
Every signed-in page shares one header: "Word Grind" plus Home, Scoreboard, Words and Settings. On a laptop the tabs sit in the header. On a phone four tabs don't fit beside the name, so the name is centred and a round menu button floats at the bottom right, where a thumb reaches it without stretching to the top of the screen. On a laptop the tabs sit right after the name, so the eye reads one group instead of jumping across the screen. The drill and the test highlight Home, since that's where they start. The tab list and the rule for which tab is highlighted live in `lib/nav.ts` so they're unit tested.

## Shared results show squares, not words
"Copy result" puts a short text on the clipboard: the app name, the day (or the test's week), one square per word in the order asked (🟩 right, 🟨 one letter off, 🟥 missed) and the score. It never includes the words or what was typed, so pasting it in a chat doesn't spoil the list for the other person before they've played. One square per word, rather than one per letter, keeps it to two lines and doesn't give away word lengths.

## A drill left midway resumes from this device's storage
Answers are saved to the database only when a drill finishes, so that a half-done drill never moves Leitner boxes. To let someone leave and come back, the answers given so far are kept in the browser's `localStorage`, tagged with the day and the drill's word ids in order. They're used only if both still match, so progress from yesterday, or from before the word list changed, is dropped instead of being applied to the wrong words. The cost is that resuming works on the same device only. If the same drill is then finished on another device, the drill page knows the person's latest finished drill, and progress saved before it is dropped, so those words aren't graded twice. Saving each answer to the database would allow cross-device resume, but it would need a table of unfinished sessions and a clean-up rule for drills that are never finished.

## Typing unlocks after the word, not after the sentence
The drill reads the word, then an example sentence. Waiting for both before showing the answer box made every word feel slow, especially with a long sentence, so the box appears once the word has been said and the sentence keeps playing underneath. Submitting stops the voice, so the feedback isn't talked over. The speaker reports the end of the first part through `onFirstDone`, which keeps the word-then-sentence queue (and its pause) in one place instead of two separate `speak` calls.

## This week's list starts closed
The home page shows this week's theme with the word count, and the words open beneath it on a tap. With the list open, ten words and definitions pushed the rest of Today below the fold on a phone, and the list is reference rather than something needed every visit. It's a native `<details>`, so it opens with a tap, Enter or Space and is announced as expandable by screen readers with no extra script.

## Each week's theme comes with a plain-English note
Claude's themes are playful ("Double Trouble: Letters That Love Company…") and sometimes too clever to be obvious, so the week's list now also asks for a `themeNote`: one plain sentence on what the theme means. An ⓘ beside the theme shows it, on hover with a mouse and on a tap on phones, which have no hover. A missing note doesn't fail the draft or cost a retry, since the theme still works without it, and weeks made before this show no ⓘ. The note is saved after `save_week`, like the week's difficulty, so the save function didn't need rewriting. Home reads the note in its own query, so a preview or a deploy that runs before the migration still shows the list, just without the ⓘ.

## Home sections load into their own boxes
Each section of the home page is its own card and streams in on its own, so a slow query only holds up its box. While a box loads it shows a placeholder of the same size (grey bars from `components/ui/skeleton.tsx`, with a screen-reader "Loading…" label), instead of one "Loading…" line followed by everything popping in and pushing the page down. The placeholders live in `app/home-skeletons.tsx`, beside the page, and are kept roughly the height of the real box so the layout doesn't jump when it arrives.

## Colours are named by meaning
`globals.css` defines the app's colours as tokens named for what they mean: `success`, `warning` and `danger` for correct, so close and missed (each with a pale `-subtle` tile background), and `player-1` and `player-2` for you and your partner on the scoreboard. Components use `text-danger` or `fill-player-1` instead of Tailwind's `text-red-700 dark:text-red-400` or a hex value, so each colour has one meaning and one place to change it, and dark mode gets its own lighter, softer values rather than a flip. The values are OKLCH and were checked for WCAG AA contrast on the app's light and dark backgrounds (text 4.5:1, borders 3:1).

## Violet is the one brand colour
The main buttons, the focus ring and the active nav tab use violet (`--primary` and `--ring`), and nothing else does. Green, amber and red already mean correct, so close and missed, and blue and orange mean the two players, so violet is the main hue left that can't be confused with any of them. Keeping it to the things you can press makes it point at the next action instead of decorating the page. Dark mode uses a lighter, softer violet with dark text on it, so button labels stay readable (about 6.6:1 in light mode and 7.5:1 in dark).

## Headings balance, paragraphs avoid lone words
`globals.css` sets `text-wrap: balance` on headings and `text-wrap: pretty` on paragraphs, list items, captions and labels, so a line like "…and a Sunday test." no longer leaves "test." alone on the last line. It's one CSS rule instead of `&nbsp;` tricks in each string, and browsers that don't support it simply wrap as before.

## Three page widths, shared with the header
`components/page.tsx` gives every signed-in page one of three widths: wide (64rem) for dashboards, reading (42rem) for lists and forms, and focus (28rem) for one task at a time, such as a drill or a test. The header uses the wide width with the same side padding, so on a big screen the logo lines up with the edge of the widest pages instead of floating on its own. A fixed set of named widths keeps pages consistent as they're added, rather than each one picking its own `max-w-*`. Home and Scoreboard stay at the focus width until they get their two-column layouts, so their cards don't stretch into one very wide column.

## Motion respects Reduce motion
Movement is opt-in with Tailwind's `motion-safe:` prefix: the letter diff's pop-in, the loading pulse and the week list's chevron only animate when the device hasn't asked to reduce motion. `globals.css` also has a catch-all for `prefers-reduced-motion: reduce` that finishes any other animation or transition at once, so a shadcn component or a future class without the prefix can't slip through. It shortens them to almost nothing rather than `none`, so anything waiting on an `animationend` or `transitionend` event still gets it. Hover colour fades become instant too, which loses nothing.

## Results never rely on colour alone
Green, amber and red are hard to tell apart with colour blindness, so every outcome also has a shape and a word: a tick for correct, an alert for so close and a cross for missed, next to the label, on the results list and on the drill's feedback. The letter diff shows what was typed above the correct spelling, so the two rows can be compared letter by letter without the colours, and the test clock's last five minutes turn bold with an alarm icon as well as red. The icons are hidden from screen readers because the label next to them already says it. The copy-result squares stay plain emoji, the format people know from Wordle.

## The keyboard shrinks the page on Android
The root layout sets `interactive-widget=resizes-content` in the viewport tag, so on Android the on-screen keyboard shrinks the page rather than sliding over it, and the answer box and Submit stay visible while typing. iOS Safari ignores the setting and scrolls the focused box into view on its own. Because the page is shorter while the keyboard is open, the floating menu button would ride up on top of it, so it hides while any input has focus (`body:has(input:focus)`). Pages size themselves with `min-h-full` and `flex-1` rather than `100vh`, so nothing else needs `dvh`.

## Sentry only runs on Vercel, and browser reports go through our own domain
Sentry is turned on only when Vercel's environment variable is set, so `pnpm dev` and tests never send events or use up the free plan's monthly quota. Browser reports go to `/monitoring` on the app's own domain, which forwards them to Sentry, because ad blockers often block requests to sentry.io directly. The proxy skips that path so a signed-out visitor's errors still get through. Events carry the user's id but never the email or IP address.
