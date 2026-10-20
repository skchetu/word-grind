import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in · Word Grind" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
      <Suspense>
        <LinkError searchParams={searchParams} />
      </Suspense>
      <LoginForm />
    </main>
  );
}

// The callback sends people back here with ?error=link when a link has
// expired, was already used, or was opened in a different browser.
async function LinkError({
  searchParams,
}: Pick<PageProps<"/login">, "searchParams">) {
  const { error } = await searchParams;
  if (error !== "link") return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      That sign-in link didn&apos;t work. Request a new one below.
    </p>
  );
}
