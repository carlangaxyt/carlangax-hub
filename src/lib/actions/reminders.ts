"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Priority } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return { supabase, user };
}

export async function createReminder(formData: FormData) {
  const { supabase, user } = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("El título es obligatorio");

  const dueAt = formData.get("due_at");
  const priority = String(formData.get("priority") ?? "normal") as Priority;

  const { error } = await supabase.from("reminders").insert({
    user_id: user.id,
    title,
    description: String(formData.get("description") ?? "") || null,
    due_at: dueAt ? new Date(String(dueAt)).toISOString() : null,
    priority,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/reminders");
}

export async function toggleReminder(id: string, done: boolean) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("reminders")
    .update({ done })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/reminders");
}

export async function deleteReminder(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("reminders").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/reminders");
}
