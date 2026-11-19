# Word Grind

A spelling and vocab app for two people: AI-generated weekly lists, spaced repetition, and a head-to-head scoreboard.

**Live app: [word-grind.vercel.app](https://word-grind.vercel.app)**. Sign-in is invite-only (a magic link for our household).

Each Monday, Claude writes a themed list of 10 GRE-style words at the household's difficulty level. Through the week, a short daily drill reads each word aloud and asks you to spell it, using spaced repetition. On Sunday, a timed test settles a head-to-head scoreboard, Claude writes a recap of the week's mistakes, and the difficulty moves up or down for next week.

## What it does

- **Weekly lists from Claude.** Each card has a definition, IPA pronunciation, syllables, origin, three example sentences and a memory hint. Every card is validated: bad cards are dropped and only the missing words are requested again, so the app never waits on a perfect reply. A curated list is the fallback if Claude can't be reached.
- **A spelling-bee drill.** The app reads the word, pauses, then reads an example sentence, and you type the spelling into a box with autocorrect off. The sentence is shown with the word blanked out. Space replays both.
- **Three example sentences per word.** Every word has three recorded sentences, so you learn the word rather than one sentence. Words from the backup lists or older weeks are topped up to three by Claude Haiku.
- **Letter-by-letter feedback.** A wrong answer is lined up against the correct spelling, showing missing, extra, wrong and swapped letters.
- **Spaced repetition.** Each day's drill is 10 words: the words due for review, then this week's new words, then, if that's still short, the words due soonest after today. Every finished drill is saved, and each word moves through five Leitner boxes (1, 2, 4, 7 and 14 days), so missed words come back sooner.
- **Results at the end.** A finished drill lists every word, missed words first, next to what was typed.
- **Mistake tips.** Claude Haiku writes a one-line tip for a specific misspelling. Tips are cached, so each one is only paid for once.
- **A timed Sunday test.** The week's 10 words with a one-hour clock and no hints. A missed test stays open as a make-up, and each person can take it once.
- **A head-to-head scoreboard.** Weekly scores side by side, daily practice streaks, a bar chart over time and each person's most-missed words.
- **Word library and settings.** A searchable table of every word seen, with a detail page per word, plus settings for your name, topics, the household name and difficulty.
- **Weekly recap.** After the Sunday test, Claude looks at the week's test answers and writes the patterns behind the mistakes and what to focus on next.
- **Adaptive difficulty.** The household's level goes up or down by one after each Sunday test, based on everyone's accuracy, and the next Monday list is written at the new level.

## How it's built

- **Next.js 16 on Vercel.** Pages are React Server Components that read straight from the database, and every write is a Server Action, so API keys, grading and scoring never reach the browser. Slow work such as recording audio runs after the response is sent (`after()`), so nothing waits on it.
- **Supabase Postgres with row-level security.** Policies limit each household's sessions, answers and settings to its own members, so privacy is enforced by the database, not only by app code. Migrations live in the repo and a GitHub Action applies them when they merge.
- **Claude with Zod-validated structured output.** Opus writes the weekly list, Sonnet the recap, and Haiku the mistake tips and extra sentences. Every reply is checked against a Zod schema, bad cards are dropped and only the missing words are requested again, and a curated list is the fallback. Tips and ElevenLabs audio clips are cached, so each is paid for once.
- **Tests on every PR.** Vitest unit tests sit next to the pure logic in `lib/` (grading, scheduling, the session state machine), with fast-check property tests and MSW so tests never call a real API. GitHub Actions runs lint, typecheck, tests and a build, and Vercel deploys a preview of each PR.
- **Sentry in production.** Errors from the server and browser, tagged by service and reason (so running out of API credit is its own alert), plus request traces and replays recorded only when an error happens.

## Tech stack

| Area           | Choice                                                                    |
| -------------- | ------------------------------------------------------------------------- |
| App            | Next.js 16 (App Router, Server Actions), React 19, TypeScript (strict)    |
| UI             | Tailwind CSS v4, shadcn/ui                                                |
| Data and auth  | Supabase (Postgres with row-level security, magic-link sign-in)           |
| AI             | Claude via the Anthropic SDK, with Zod-validated structured output        |
| Speech         | ElevenLabs clips, with the Web Speech API (`speechSynthesis`) as fallback |
| Tests          | Vitest, fast-check, MSW (no real API calls in tests)                      |
| Hosting and CI | Vercel, GitHub Actions                                                    |
| Monitoring     | Sentry (errors, traces, logs and replays of errors)                       |

The colour scheme (sage, forest and coral) was influenced by @andydandybuilds on TikTok.

## Algorithms

The interesting logic is plain TypeScript in `lib/`, with unit tests next to each file.

| Algorithm                                        | What it does                                                                                                                                                                                                    | Code                                                               |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Answer normalization                             | Ignores case, stray spaces and curly apostrophes from phone keyboards, so only real spelling mistakes count.                                                                                                    | [normalize.ts](lib/grading/normalize.ts)                           |
| Levenshtein edit distance                        | Counts the fewest single-letter inserts, deletes and substitutions that turn the answer into the word, using a dynamic-programming grid. One edit away is shown as "so close".                                  | [distance.ts](lib/grading/distance.ts)                             |
| Damerau transposition (optimal string alignment) | Counts swapping two neighbouring letters as one edit, so "recieve" is one mistake, not two.                                                                                                                     | [distance.ts](lib/grading/distance.ts)                             |
| Letter alignment                                 | Walks back through the same grid to recover which letters were kept, missing, extra, wrong or swapped. This drives the letter-by-letter feedback.                                                               | [align.ts](lib/grading/align.ts), [tiles.ts](lib/grading/tiles.ts) |
| Leitner boxes (spaced repetition)                | A right answer moves a word up one of five boxes (1, 2, 4, 7, 14 days). A wrong one sends it back to box 1.                                                                                                     | [schedule.ts](lib/srs/schedule.ts)                                 |
| Daily drill picker                               | Exactly 10 words: most overdue first, then this week's words not yet reviewed, then the soonest-due words to fill the day's first drill.                                                                        | [pick.ts](lib/srs/pick.ts)                                         |
| Server-side regrading                            | Drills and tests send only what was typed. The server grades each answer again and scores a test against the week's whole list, so a browser can't fake a correct answer or skip a word.                        | [records.ts](lib/session/records.ts)                               |
| Session state machine                            | One pure `transition(state, event)` function runs the drill and test, so repeated Enter presses or late audio callbacks can't skip a word or grade it twice.                                                    | [machine.ts](lib/session/machine.ts)                               |
| Weekly list repair                               | Validates each card on its own, drops bad ones, and asks Claude only for the missing words instead of regenerating the whole list.                                                                              | [generate-week.ts](lib/ai/generate-week.ts)                        |
| Adaptive difficulty                              | Pools the household's Sunday answers: 85% or more moves the level up one, 60% or less moves it down one, and the next list is written at that level.                                                            | [adapt.ts](lib/difficulty/adapt.ts)                                |
| Speech queue                                     | Reads the word, pauses, then reads the sentence. Plays the recorded clip when there is one, falls back to the browser voice if it fails, and handles quirks such as late-loading voices and interrupted speech. | [speaker.ts](lib/speech/speaker.ts)                                |
| Theme contrast check                             | Converts each OKLCH colour token to sRGB and checks the WCAG contrast of every text and control pair in both themes, so a colour change that makes text hard to read fails the tests.                           | [contrast.ts](lib/theme/contrast.ts)                               |

## Tools and why

| Tool                           | Why this one                                                                                                                                                                                                                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js 16**                 | Server Actions keep the Anthropic key and database writes on the server without a separate API layer. Also deploys to Vercel with no setup.                                                                                                                                            |
| **TypeScript (strict)**        | `noUncheckedIndexedAccess` catches off-by-one and missing-item bugs in the grading and drill code.                                                                                                                                                                                     |
| **Zod**                        | One schema describes Claude's output, the database rows and the UI types, so they can't drift apart. Claude's replies are checked against it before anything is saved.                                                                                                                 |
| **Supabase**                   | Postgres with row-level security and magic-link sign-in in one free service. RLS keeps each household's data private at the database level, not just in the app.                                                                                                                       |
| **Claude (Anthropic SDK)**     | Structured output generates themed, difficulty-tuned lists with sentences and memory hints. Opus writes the weekly list, and the cheaper, faster Haiku writes the one-line mistake tips and fresh example sentences.                                                                   |
| **Tailwind CSS and shadcn/ui** | Accessible components as source code in the repo, easy to restyle, with no runtime styling library.                                                                                                                                                                                    |
| **Web Speech API**             | Free and built into every browser, with no extra service. It reads any word that doesn't have a recorded clip yet.                                                                                                                                                                     |
| **ElevenLabs**                 | Natural-sounding recorded audio for each word and sentence (Flash v2.5), made once when the list is generated and cached in Supabase Storage. The drill falls back to the browser voice for any word without a clip.                                                                   |
| **Vitest, fast-check and MSW** | Fast unit tests, property-based tests for the scheduling and difficulty rules, and a mocked Claude API, so tests never make real AI calls.                                                                                                                                             |
| **Playwright** (planned)       | End-to-end tests of the drill and the Sunday test on phone and laptop sizes.                                                                                                                                                                                                           |
| **Sentry**                     | One place to see errors from the server and the browser, with readable stack traces, request traces, warnings as searchable logs, and a replay of the clicks before a browser error. The free plan covers two users, and it only runs on Vercel, so local runs and tests send nothing. |
| **Vercel and GitHub Actions**  | Every PR gets lint, typecheck, tests, a build and a live preview link. Merged migrations are applied to the database automatically.                                                                                                                                                    |
| **pnpm**                       | Fast installs and a strict dependency tree, so a package can't quietly use something it didn't declare.                                                                                                                                                                                |

## Running it locally

You need Node 24 and pnpm (through Corepack).

```bash
git clone https://github.com/skchetu/word-grind.git
cd word-grind
corepack enable pnpm
pnpm install
cp .env.example .env.local   # then fill in the Supabase and Anthropic keys (ElevenLabs is optional)
pnpm dev                     # http://localhost:3000
```

Other commands:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm eval:week   # generates 5 real lists and checks them (costs a few cents)
```

The database schema lives in `supabase/migrations`. A GitHub Action applies new migrations to the production database when they merge to `main`.

## Project layout

```
app/                 routes, pages and server actions
components/session/  the drill: answer box, letter diff, results
lib/grading/         normalize, edit distance, letter alignment
lib/srs/             Leitner scheduling and the daily drill picker
lib/session/         the drill's state machine, saved records, results
lib/ai/              prompts, schemas, week generation, tips
lib/speech/          ElevenLabs clips, read-aloud queue and React hook
lib/week/            week dates, saving a list, loading drill words
lib/difficulty/      adaptive difficulty rule
supabase/migrations/ schema, RLS policies, database functions
docs/DECISIONS.md    why things are built the way they are
```

Design choices, and the alternatives that were considered, are logged in [docs/DECISIONS.md](docs/DECISIONS.md).

## Roadmap

- **Playwright end-to-end tests** of the drill and the Sunday test at phone and laptop sizes.
- **A guest demo** with its own seeded household, so the app can be tried without an invite.
- **Sign-in links that work on any device**, by switching magic links to Supabase's token-hash flow, plus a 6-digit code for the iPhone home-screen app.
- **Sunday tests that mix in recently missed words**, not only the week's own list.
- **Gentler review spacing** for long-known words: a little random "fuzz" on due dates, and longer boxes after 14 days.
