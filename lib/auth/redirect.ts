// Pages a signed-out visitor may open. Everything else needs a session.
const PUBLIC_PREFIXES = ["/login", "/auth/"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// Where the proxy should send a request, or null to let it through.
export function authRedirect(
  pathname: string,
  signedIn: boolean,
): string | null {
  if (!signedIn && !isPublic(pathname)) return "/login";
  if (signedIn && pathname === "/login") return "/";
  return null;
}
