"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { reportError } from "@/lib/monitoring/report-error";

export type LoginState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string };

const emailSchema = z.email();

export async function sendMagicLink(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) {
    return { status: "error", message: "Enter a valid email address." };
  }

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: {
      // Accounts are created by invitation only, so strangers can't sign up.
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error?.status === 429) {
    return {
      status: "error",
      message: "Too many attempts. Wait a minute and try again.",
    };
  }
  // Unknown emails land here too ("otp_disabled", since sign-ups are off).
  // Reporting "sent" either way keeps the form from revealing which
  // addresses have accounts; only a real failure goes to Sentry.
  if (error && error.code !== "otp_disabled") {
    reportError("supabase", "Magic link not sent", error);
  }
  return { status: "sent", email: email.data };
}
