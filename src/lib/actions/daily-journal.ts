"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return { supabase, user };
}

export async function saveDailyJournalEntry(journalDate: string, content: string) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("daily_journal").upsert(
    {
      user_id: user.id,
      journal_date: journalDate,
      content,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,journal_date" },
  );

  if (error) throw new Error(error.message);
  revalidatePath("/trading/calendar");
}
