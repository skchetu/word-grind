"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { householdFormSchema, profileFormSchema } from "@/lib/settings/profile";
import { createClient } from "@/lib/supabase/server";

export type ProfileState =
  | { status: "idle" | "saved" }
  | { status: "error"; message: string };

// Saves the signed-in person's name and topics. RLS and the column grants
// only let people change these fields on their own profile.
export async function saveProfile(
  _previous: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const form = profileFormSchema.safeParse({
    displayName: formData.get("displayName") ?? "",
    topics: formData.get("topics") ?? "",
  });
  if (!form.success) {
    return {
      status: "error",
      message: form.error.issues[0]?.message ?? "Check the form.",
    };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: form.data.displayName, topics: form.data.topics })
    .eq("id", userId);
  if (error) {
    console.error("saveProfile failed", error);
    return { status: "error", message: "Couldn't save. Try again." };
  }
  revalidatePath("/", "layout");
  return { status: "saved" };
}

// Saves the household's name and difficulty level. RLS limits the update to
// the caller's own household, and only these two columns are granted.
export async function saveHousehold(
  _previous: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const form = householdFormSchema.safeParse({
    name: formData.get("name") ?? "",
    difficulty: formData.get("difficulty") ?? "",
  });
  if (!form.success) {
    return {
      status: "error",
      message: form.error.issues[0]?.message ?? "Check the form.",
    };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", userId)
    .single();
  const householdId = z.uuid().safeParse(profile?.household_id);
  if (!householdId.success) {
    return { status: "error", message: "You're not in a household yet." };
  }

  const { error } = await supabase
    .from("households")
    .update(form.data)
    .eq("id", householdId.data);
  if (error) {
    console.error("saveHousehold failed", error);
    return { status: "error", message: "Couldn't save. Try again." };
  }
  revalidatePath("/", "layout");
  return { status: "saved" };
}
