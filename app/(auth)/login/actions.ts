"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

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
  if (error) {
    // Unknown emails land here too. Reporting "sent" either way keeps the
    // form from revealing which addresses have accounts.
    console.error("Magic link not sent:", error.message);
  }
  return { status: "sent", email: email.data };
}
