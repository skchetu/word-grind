"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { sendMagicLink, type LoginState } from "./actions";

const initialState: LoginState = { status: "idle" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    sendMagicLink,
    initialState,
  );

  if (state.status === "sent") {
    return (
      <p role="status" className="text-muted-foreground">
        If {state.email} has an account, a sign-in link is on its way. Open it
        on this device.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-3 text-left">
      <label htmlFor="email" className="text-sm font-medium">
        Email
      </label>
      <Input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        aria-invalid={state.status === "error"}
        aria-describedby={state.status === "error" ? "email-error" : undefined}
      />
      {state.status === "error" && (
        <p id="email-error" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Email me a sign-in link"}
      </Button>
    </form>
  );
}
