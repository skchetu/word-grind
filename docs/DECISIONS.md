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
