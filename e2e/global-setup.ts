import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { FullConfig } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import { AUTH_FILE, assertLocal, e2eEnv, TEST_USER } from "./env";

// Creates the test player (the signup trigger gives them a household) and
// signs in once, saving the session cookies for every signed-in test. The
// app only sends magic links, so the password exists just for this setup.
export default async function globalSetup(config: FullConfig) {
  assertLocal(e2eEnv.supabaseUrl);
  const baseURL = config.projects[0]?.use.baseURL;
  if (!baseURL) throw new Error("Playwright baseURL is not set");

  const admin = createClient(e2eEnv.supabaseUrl, e2eEnv.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: createError } = await admin.auth.admin.createUser({
    ...TEST_USER,
    email_confirm: true,
  });
  if (createError && createError.code !== "email_exists") throw createError;

  // Collects the cookies @supabase/ssr would set in the browser.
  const jar = new Map<string, string>();
  const supabase = createServerClient(
    e2eEnv.supabaseUrl,
    e2eEnv.publishableKey,
    {
      cookies: {
        getAll: () => [...jar].map(([name, value]) => ({ name, value })),
        setAll: (cookies) => {
          for (const { name, value } of cookies) jar.set(name, value);
        },
      },
    },
  );
  const { error } = await supabase.auth.signInWithPassword(TEST_USER);
  if (error) throw error;

  const { hostname } = new URL(baseURL);
  const state = {
    cookies: [...jar].map(([name, value]) => ({
      name,
      value,
      domain: hostname,
      path: "/",
      expires: -1,
      httpOnly: false,
      secure: false,
      sameSite: "Lax" as const,
    })),
    origins: [],
  };
  await mkdir(dirname(AUTH_FILE), { recursive: true });
  await writeFile(AUTH_FILE, JSON.stringify(state, null, 2));
}
