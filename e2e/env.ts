import { execSync } from "node:child_process";

import { z } from "zod";

const statusSchema = z.object({
  API_URL: z.url(),
  PUBLISHABLE_KEY: z.string().min(1),
  SECRET_KEY: z.string().min(1),
});

// Reads the local stack's URL and keys from `supabase status`, so no key is
// written into the repo. Uses an installed CLI (as in CI) or the pinned one.
function localStack() {
  for (const cli of ["supabase", "pnpm dlx supabase@2.122.0"]) {
    try {
      const out = execSync(`${cli} status -o json`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      return statusSchema.parse(JSON.parse(out));
    } catch {
      // Try the next CLI.
    }
  }
  throw new Error(
    "No local Supabase is running. Start one with: pnpm dlx supabase@2.122.0 start",
  );
}

const stack = localStack();

export const e2eEnv = {
  supabaseUrl: stack.API_URL,
  publishableKey: stack.PUBLISHABLE_KEY,
  secretKey: stack.SECRET_KEY,
};

export const TEST_USER = {
  email: "player@example.com",
  password: "e2e-password-123",
};

export const AUTH_FILE = "e2e/.auth/player.json";

// Guards against pointing the tests (which create users) at a real project.
export function assertLocal(url: string) {
  const { hostname } = new URL(url);
  if (hostname !== "127.0.0.1" && hostname !== "localhost") {
    throw new Error(`E2E tests only run against a local Supabase, not ${url}`);
  }
}
