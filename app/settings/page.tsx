import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

import { HouseholdForm } from "./household-form";
import { ProfileForm } from "./profile-form";
import { ThemePicker } from "./theme-picker";

export const metadata: Metadata = { title: "Settings · Word Grind" };

const profileSchema = z.object({
  display_name: z.string(),
  topics: z.array(z.string()),
  households: z.object({ name: z.string(), difficulty: z.int() }).nullable(),
});

const membersSchema = z.array(
  z.object({ id: z.string(), display_name: z.string() }),
);

// Your own settings, then the ones you share with your household.
async function SettingsForms() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("display_name, topics, households(name, difficulty)")
    .eq("id", userId)
    .single();
  const profile = profileSchema.parse(data);
  // RLS returns only profiles in your household.
  const { data: memberRows } = await supabase
    .from("profiles")
    .select("id, display_name");
  const members = membersSchema
    .parse(memberRows ?? [])
    .sort((a, b) => Number(b.id === userId) - Number(a.id === userId));
  return (
    <>
      <section aria-labelledby="you-heading" className="w-full">
        <h2 id="you-heading" className="mb-3 text-lg font-semibold">
          You
        </h2>
        <ProfileForm
          displayName={profile.display_name}
          topics={profile.topics}
        />
      </section>
      <section aria-labelledby="device-heading" className="w-full">
        <h2 id="device-heading" className="mb-3 text-lg font-semibold">
          This device
        </h2>
        <ThemePicker />
      </section>
      {profile.households && (
        <section aria-labelledby="household-heading" className="w-full">
          <h2 id="household-heading" className="mb-3 text-lg font-semibold">
            Household
          </h2>
          <h3 className="text-sm font-medium">Members</h3>
          <ul className="mb-4 text-sm text-muted-foreground">
            {members.map((member) => (
              <li key={member.id}>
                {member.display_name}
                {member.id === userId && " (you)"}
              </li>
            ))}
          </ul>
          <HouseholdForm
            name={profile.households.name}
            difficulty={profile.households.difficulty}
          />
        </section>
      )}
    </>
  );
}

export default function SettingsPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-6 px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        <SettingsForms />
      </Suspense>
      <Button asChild variant="outline">
        <Link href="/">Home</Link>
      </Button>
    </main>
  );
}
