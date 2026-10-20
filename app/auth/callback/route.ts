import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

// The magic link lands here with a one-time code. Exchanging it sets the
// session cookies, then the user continues to the app.
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/`);
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
