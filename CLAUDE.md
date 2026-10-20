# Word Grind

A spelling and vocab app for two people: a weekly Claude-generated word list, a daily spaced-repetition drill, and a timed Sunday test with a head-to-head scoreboard. The full spec (`GUIDE.md`) is kept private, outside this repo, in the Claude project's shared files (`/mnt/project-files/GUIDE.md` in Claude sessions). Non-obvious choices are logged in `docs/DECISIONS.md`.

@AGENTS.md

## Commands

Node 24 (`.nvmrc`) and pnpm via corepack (`packageManager` in `package.json`).

| Task | Command |
|---|---|
| Install | `pnpm install` |
| Dev server | `pnpm dev` (http://localhost:3000) |
| Lint | `pnpm lint` |
| Typecheck | `pnpm typecheck` |
| Unit tests | `pnpm test` (watch: `pnpm test:watch`) |
| Production build | `pnpm build` |

CI (`.github/workflows/ci.yml`) runs lint, typecheck, test and build on every PR. End-to-end tests (`pnpm e2e`, Playwright) arrive on Day 6.

## Working agreements

**Pull requests**
- One small feature per PR: aim for about 150 changed lines, excluding lockfiles and generated files. Split anything bigger into a stack.
- Open the PR and stop. Never merge or approve. Chetu reviews and squash-merges; address review comments on the same branch, then start the next PR from the updated `main`.
- Don't start work that depends on an unmerged PR unless asked.
- CI must be green before asking for review.
- PR titles use Conventional Commits (`feat:`, `fix:`, `chore:`).
- PR description sections: What, Why, How to test, Screenshots, Out of scope.
  - **Why** explains the reasoning and the benefit (what it prevents, what it enables), not just which plan step it is.
  - **How to test** gives exact terminal steps a beginner can copy, plus the tests added.
  - The repo is public: no links to Claude sessions in PR descriptions or commit messages.
  - Write descriptions in the author's voice, scoped to the project and the change. No asides addressed to the reviewer, and no career or interview commentary.

**Code**
- TypeScript strict, no `any`. `noUncheckedIndexedAccess` is on, so handle `undefined` from index access.
- Zod schemas are the source of truth for shared types (AI output, database rows, forms).
- Pure logic (grading, SRS, session state machine) lives in `/lib` with unit tests written alongside (`*.test.ts`).
- Never call the real Claude API in tests; use MSW fixtures.
- `ANTHROPIC_API_KEY` stays server-side (`.env.local`, Vercel env). Never import it into client components.
- shadcn/ui components live in `components/ui`. Add them with `pnpm dlx shadcn@latest add <name>`.
- Record any non-obvious choice in `docs/DECISIONS.md`, one short entry each.
