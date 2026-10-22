# Word Grind

A spelling and vocabulary app for a two-person household. Each Monday, Claude writes a themed list of 12 to 15 GRE-style words at the household's difficulty level. Through the week, a short daily drill reads each word aloud and asks you to spell it, using spaced repetition. On Sunday, a timed test settles a head-to-head scoreboard.

> Work in progress. The drill, word generation and grading work today. The Sunday test, scoreboard and settings are being built.

## What it does

- **Weekly lists from Claude.** Each card has a definition, IPA pronunciation, syllables, origin, two example sentences and a memory hint. Every card is validated: bad cards are dropped and only the missing words are requested again, so the app never waits on a perfect reply. A curated list is the fallback if Claude can't be reached.
- **A spelling-bee drill.** The app reads the word aloud, and you type the spelling into a box with autocorrect off. Space replays the word.
- **Letter-by-letter feedback.** A wrong answer is lined up against the correct spelling, showing missing, extra, wrong and swapped letters.
- **Spaced repetition.** Words move through five Leitner boxes (1, 2, 4, 7 and 14 days), so missed words come back sooner.
- **Mistake tips.** Claude Haiku writes a one-line tip for a specific misspelling. Tips are cached, so each one is only paid for once.
- **Adaptive difficulty** (in progress). The household's level will go up or down by one after each Sunday test, based on everyone's accuracy.

## Tech stack

| Area           | Choice                                                                 |
| -------------- | ---------------------------------------------------------------------- |
| App            | Next.js 16 (App Router, Server Actions), React 19, TypeScript (strict) |
| UI             | Tailwind CSS v4, shadcn/ui                                             |
| Data and auth  | Supabase (Postgres with row-level security, magic-link sign-in)        |
| AI             | Claude via the Anthropic SDK, with Zod-validated structured output     |
| Speech         | Web Speech API (`speechSynthesis`)                                     |
| Tests          | Vitest, fast-check, MSW (no real API calls in tests)                   |
| Hosting and CI | Vercel, GitHub Actions                                                 |

## Running it locally

You need Node 24 and pnpm (through Corepack).

```bash
git clone https://github.com/skchetu/word-grind.git
cd word-grind
corepack enable pnpm
pnpm install
cp .env.example .env.local   # then fill in the Supabase and Anthropic keys
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
components/session/  the drill: answer box, letter diff
lib/grading/         normalize, edit distance, letter alignment
lib/srs/             Leitner scheduling
lib/session/         the drill's state machine
lib/ai/              prompts, schemas, week generation, tips
lib/speech/          read-aloud queue and React hook
supabase/migrations/ schema, RLS policies, database functions
docs/DECISIONS.md    why things are built the way they are
```

Design choices, and the alternatives that were considered, are logged in [docs/DECISIONS.md](docs/DECISIONS.md).
