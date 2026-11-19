import { createClient } from "@supabase/supabase-js";
import { connection, NextResponse } from "next/server";

import { publicEnv } from "@/lib/env";
import { checkHealth } from "@/lib/monitoring/health";

// Polled by Sentry's uptime monitor. It answers without a session and runs
// one tiny database function, so a paused or unreachable Supabase project
// shows up as a 503 rather than as a login page that still loads.
export async function GET() {
  await connection();
  const env = publicEnv();
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { status, body } = await checkHealth(() =>
    supabase.rpc("health_check").abortSignal(AbortSignal.timeout(5000)),
  );
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
