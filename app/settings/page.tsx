import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Settings · Word Grind" };

const profileSchema = z.object({
  display_name: z.string(),
  topics: z.array(z.string()),
});

async function Profile() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("display_name, topics")
    .eq("id", userId)
    .single();
  const profile = profileSchema.parse(data);
  return (
    <ProfileForm displayName={profile.display_name} topics={profile.topics} />
  );
}

export default function SettingsPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-6 px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        <Profile />
      </Suspense>
      <Button asChild variant="outline">
        <Link href="/">Home</Link>
      </Button>
    </main>
  );
}
