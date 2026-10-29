import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

import { signOut } from "./actions";

// The signed-in email and a Sign out button, shown in the header on laptops
// and at the bottom of the menu on phones. Reads the session, so it renders
// per request behind a Suspense boundary.
export async function Account() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims.email;
  if (typeof email !== "string") return null;

  return (
    <form
      action={signOut}
      className="flex min-w-0 flex-col items-start gap-2 text-sm text-muted-foreground md:flex-row md:items-center md:gap-3"
    >
      <span
        className="max-w-full truncate md:hidden lg:inline lg:max-w-64"
        title={email}
      >
        {email}
      </span>
      <Button type="submit" variant="outline" size="sm">
        Sign out
      </Button>
    </form>
  );
}
