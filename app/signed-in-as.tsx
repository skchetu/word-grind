import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

import { signOut } from "./actions";

// Reads the session, so it renders per request behind a Suspense boundary.
export async function SignedInAs() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims.email;

  return (
    <form
      action={signOut}
      className="flex flex-col items-center gap-2 text-sm text-muted-foreground"
    >
      {email && <p>Signed in as {email}</p>}
      <Button type="submit" variant="outline" size="sm">
        Sign out
      </Button>
    </form>
  );
}
