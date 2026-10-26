"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { profileFormSchema } from "@/lib/settings/profile";
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
