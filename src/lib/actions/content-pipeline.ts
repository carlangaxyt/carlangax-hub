"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ContentStage } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return { supabase, user };
}

export async function createContentIdea(input: {
  title: string;
  stage: ContentStage;
  platform: string | null;
}) {
  const { supabase, user } = await requireUser();

  const { data: last } = await supabase
    .from("content_ideas")
    .select("sort_order")
    .eq("user_id", user.id)
    .eq("stage", input.stage)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("content_ideas").insert({
    user_id: user.id,
    title: input.title,
    stage: input.stage,
    platform: input.platform,
    sort_order: (last?.sort_order ?? 0) + 1,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/videos/pipeline");
}

export async function updateContentIdea(input: {
  id: string;
  title: string;
  platform: string | null;
  notes: string | null;
  series: string | null;
  content_type: string | null;
  record_location: string | null;
  scheduled_date: string | null;
  published_date: string | null;
  published_link: string | null;
}) {
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("content_ideas")
    .update({
      title: input.title,
      platform: input.platform,
      notes: input.notes,
      series: input.series,
      content_type: input.content_type,
      record_location: input.record_location,
      scheduled_date: input.scheduled_date,
      published_date: input.published_date,
      published_link: input.published_link,
    })
    .eq("id", input.id);

  if (error) throw new Error(error.message);
  revalidatePath("/videos/pipeline");
}

export async function moveContentIdea(id: string, stage: ContentStage) {
  const { supabase, user } = await requireUser();

  const { data: last } = await supabase
    .from("content_ideas")
    .select("sort_order")
    .eq("user_id", user.id)
    .eq("stage", stage)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase
    .from("content_ideas")
    .update({ stage, sort_order: (last?.sort_order ?? 0) + 1 })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/videos/pipeline");
}

export async function deleteContentIdea(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("content_ideas")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/videos/pipeline");
}

type OptionField = "platform" | "series" | "content_type";

async function eachMatchingRow(
  field: OptionField,
  value: string,
  apply: (current: string) => string | null,
) {
  const { supabase, user } = await requireUser();
  const isMulti = field === "platform";

  const { data: rows, error } = await supabase
    .from("content_ideas")
    .select(`id, ${field}`)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  for (const row of (rows ?? []) as { id: string; [key: string]: string | null }[]) {
    const current = row[field];
    if (!current) continue;

    if (isMulti) {
      const parts = current.split(",").map((s) => s.trim()).filter(Boolean);
      if (!parts.includes(value)) continue;
      const nextParts = parts
        .map((p) => (p === value ? apply(p) : p))
        .filter((p): p is string => Boolean(p));
      const deduped = Array.from(new Set(nextParts));
      await supabase
        .from("content_ideas")
        .update({ [field]: deduped.length ? deduped.join(", ") : null })
        .eq("id", row.id);
    } else {
      if (current !== value) continue;
      await supabase
        .from("content_ideas")
        .update({ [field]: apply(current) })
        .eq("id", row.id);
    }
  }

  revalidatePath("/videos/pipeline");
}

export async function renameOptionValue(
  field: OptionField,
  oldValue: string,
  newValue: string,
) {
  const trimmed = newValue.trim();
  if (!trimmed || trimmed === oldValue) return;
  await eachMatchingRow(field, oldValue, () => trimmed);
}

export async function deleteOptionValue(field: OptionField, value: string) {
  await eachMatchingRow(field, value, () => null);
}

export async function saveBlueprint(content: string) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("content_blueprint").upsert(
    {
      user_id: user.id,
      content,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) throw new Error(error.message);
  revalidatePath("/videos/pipeline");
}
