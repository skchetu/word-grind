import { defineConfig, devices } from "@playwright/test";

import { e2eEnv } from "./e2e/env";

const PORT = 3100;

// End-to-end tests run a production build against a local Supabase stack
// (`supabase start`), never the real project. Claude and ElevenLabs are
// pointed at nothing, so the app takes its fallback paths and costs nothing.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"] } },
    { name: "laptop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: e2eEnv.supabaseUrl,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: e2eEnv.publishableKey,
      // Set but unreachable, so every Claude call fails fast and the
      // curated fallback list is used.
      ANTHROPIC_API_KEY: "e2e-no-key",
      ANTHROPIC_BASE_URL: "http://127.0.0.1:9",
      ELEVENLABS_API_KEY: "",
      NEXT_PUBLIC_SENTRY_DSN: "",
    },
  },
});
