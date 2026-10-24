# Word Grind (in progress...)

A spelling and vocabulary app for a two-person household. Each Monday, Claude writes a themed list of 15 GRE-style words at the household's difficulty level. Through the week, a short daily drill reads each word aloud and asks you to spell it, using spaced repetition. On Sunday, a timed test settles a head-to-head scoreboard.

> Work in progress. Weekly lists, recorded audio, grading and the daily drill with spaced repetition work today. The Sunday test, scoreboard and settings are being built.

## What it does

- **Weekly lists from Claude.** Each card has a definition, IPA pronunciation, syllables, origin, two example sentences and a memory hint. Every card is validated: bad cards are dropped and only the missing words are requested again, so the app never waits on a perfect reply. A curated list is the fallback if Claude can't be reached.
- **A spelling-bee drill.** The app reads the word aloud, and you type the spelling into a box with autocorrect off. Space replays the word.
- **Letter-by-letter feedback.** A wrong answer is lined up against the correct spelling, showing missing, extra, wrong and swapped letters.
- **Spaced repetition.** Each day's drill is the words due for review plus this week's new words, up to 15. Every finished drill is saved, and each word moves through five Leitner boxes (1, 2, 4, 7 and 14 days), so missed words come back sooner.
- **Results at the end.** A finished drill lists every word, missed words first, next to what was typed.
- **Mistake tips.** Claude Haiku writes a one-line tip for a specific misspelling. Tips are cached, so each one is only paid for once.
- **Adaptive difficulty** (in progress). The household's level will go up or down by one after each Sunday test, based on everyone's accuracy.

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

## Algorithms

The interesting logic is plain TypeScript in `lib/`, with unit tests next to each file. Items marked **TBD** aren't built yet.

| Algorithm                                        | What it does                                                                                                                                                                                                    | Code                                                               |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Answer normalization                             | Ignores case, stray spaces and curly apostrophes from phone keyboards, so only real spelling mistakes count.                                                                                                    | [normalize.ts](lib/grading/normalize.ts)                           |
| Levenshtein edit distance                        | Counts the fewest single-letter inserts, deletes and substitutions that turn the answer into the word, using a dynamic-programming grid. One edit away is shown as "so close".                                  | [distance.ts](lib/grading/distance.ts)                             |
| Damerau transposition (optimal string alignment) | Counts swapping two neighbouring letters as one edit, so "recieve" is one mistake, not two.                                                                                                                     | [distance.ts](lib/grading/distance.ts)                             |
| Letter alignment                                 | Walks back through the same grid to recover which letters were kept, missing, extra, wrong or swapped. This drives the letter-by-letter feedback.                                                               | [align.ts](lib/grading/align.ts), [tiles.ts](lib/grading/tiles.ts) |
| Leitner boxes (spaced repetition)                | A right answer moves a word up one of five boxes (1, 2, 4, 7, 14 days). A wrong one sends it back to box 1.                                                                                                     | [schedule.ts](lib/srs/schedule.ts)                                 |
| Daily drill picker                               | Most overdue words first, then this week's words not yet reviewed, capped at 15 so a backlog never turns into a chore.                                                                                          | [pick.ts](lib/srs/pick.ts)                                         |
| Server-side regrading                            | A finished drill sends only what was typed. The server grades each answer again against the stored word before saving the score, attempts and new boxes, so a browser can't fake a correct answer.              | [records.ts](lib/session/records.ts)                               |
| Session state machine                            | One pure `transition(state, event)` function runs the drill and test, so repeated Enter presses or late audio callbacks can't skip a word or grade it twice.                                                    | [machine.ts](lib/session/machine.ts)                               |
| Weekly list repair                               | Validates each card on its own, drops bad ones, and asks Claude only for the missing words instead of regenerating the whole list.                                                                              | [generate-week.ts](lib/ai/generate-week.ts)                        |
| Adaptive difficulty                              | Pools the household's Sunday answers: 85% or more moves the level up one, 60% or less moves it down one. Written and tested; **TBD**: wiring it to the weekly list.                                             | [adapt.ts](lib/difficulty/adapt.ts)                                |
| Speech queue                                     | Reads the word, pauses, then reads the sentence. Plays the recorded clip when there is one, falls back to the browser voice if it fails, and handles quirks such as late-loading voices and interrupted speech. | [speaker.ts](lib/speech/speaker.ts)                                |

## Tools and why

| Tool                           | Why this one                                                                                                                                                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js 16**                 | Server Actions keep the Anthropic key and database writes on the server without a separate API layer. Also deploys to Vercel with no setup.                                                                          |
| **TypeScript (strict)**        | `noUncheckedIndexedAccess` catches off-by-one and missing-item bugs in the grading and drill code.                                                                                                                   |
| **Zod**                        | One schema describes Claude's output, the database rows and the UI types, so they can't drift apart. Claude's replies are checked against it before anything is saved.                                               |
| **Supabase**                   | Postgres with row-level security and magic-link sign-in in one free service. RLS keeps each household's data private at the database level, not just in the app.                                                     |
| **Claude (Anthropic SDK)**     | Structured output generates themed, difficulty-tuned lists with sentences and memory hints. Opus writes the weekly list, and the cheaper, faster Haiku writes the one-line mistake tips.                             |
| **Tailwind CSS and shadcn/ui** | Accessible components as source code in the repo, easy to restyle, with no runtime styling library.                                                                                                                  |
| **Web Speech API**             | Free and built into every browser, with no extra service. It reads any word that doesn't have a recorded clip yet.                                                                                                   |
| **ElevenLabs**                 | Natural-sounding recorded audio for each word and sentence (Flash v2.5), made once when the list is generated and cached in Supabase Storage. The drill falls back to the browser voice for any word without a clip. |
| **Vitest, fast-check and MSW** | Fast unit tests, property-based tests for the scheduling and difficulty rules, and a mocked Claude API, so tests never make real AI calls.                                                                           |
| **Playwright** (**TBD**)       | End-to-end tests of the drill and the Sunday test on phone and laptop sizes.                                                                                                                                         |
| **Vercel and GitHub Actions**  | Every PR gets lint, typecheck, tests, a build and a live preview link.                                                                                                                                               |
| **pnpm**                       | Fast installs and a strict dependency tree, so a package can't quietly use something it didn't declare.                                                                                                              |

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

The database schema lives in `supabase/migrations`.

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
