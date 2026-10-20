import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { authRedirect } from "@/lib/auth/redirect";
import { publicEnv } from "@/lib/env";

// Refreshes the auth session before a page renders, writing any new tokens
// to both the request (for this render) and the response (for the browser).
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const env = publicEnv();

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          // Keeps CDNs from caching a response that carries a session token.
          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  // Verifies the token and refreshes it if it has expired. Keep this call
  // directly after creating the client, or users can be signed out at random.
  const { data } = await supabase.auth.getClaims();

  const destination = authRedirect(
    request.nextUrl.pathname,
    Boolean(data?.claims),
  );
  if (destination) {
    const url = request.nextUrl.clone();
    url.pathname = destination;
    url.search = "";
    // Carry over any refreshed session cookies, or the redirect drops them.
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  }

  return response;
}
