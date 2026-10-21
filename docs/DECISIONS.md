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

## Weekly list: retry bad output once, fall back on API errors
`generateWeek` asks Claude (Opus 5.5 at low effort, structured output from `weekSchema`) for the list. A list that fails the shape or `checkWeek` gets one more try, since a second sample often fixes it. An API error goes straight to a curated fallback week, because the SDK has already retried timeouts and rate limits, and errors such as an empty credit balance won't fix themselves. Either way the app always has a list.

## Weeks are saved through a database function, not the service role
`public.save_week` is a `security definer` function that signed-in users can call. It writes the week, any new words, their sentences and the week's word order in one transaction, always for the caller's household. The original plan was to write with the Supabase service role key. The function avoids handling a second, all-powerful secret, and it makes the save atomic, which four separate API inserts can't be. The cost is that a signed-in member could save a week by hand, which is acceptable for a two-person household.
