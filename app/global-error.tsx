"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Last-resort screen when the root layout itself fails. Reports the error,
// since nothing else on the page is left to catch it.
export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-svh flex-col items-center justify-center gap-4 p-4 text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-md border px-4 py-2 text-sm"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
