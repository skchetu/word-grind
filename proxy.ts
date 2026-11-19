import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Everything except static assets, image optimization, the Sentry
    // tunnel (error reports must reach Sentry even when signed out) and the
    // health check (the uptime monitor has no session).
    "/((?!_next/static|_next/image|monitoring|api/health|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
