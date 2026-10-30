"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Tags browser error reports with the signed-in user's id (never the email),
// so Sentry can tell who hit a problem.
export function SentryUser({ id }: { id: string }) {
  useEffect(() => {
    Sentry.setUser({ id });
    return () => Sentry.setUser(null);
  }, [id]);
  return null;
}
