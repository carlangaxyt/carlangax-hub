"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ContentStage, PropertyType } from "@/lib/types";

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
    sort_order: (last?.sort_order ?? 0) + 1,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/videos/pipeline");
}

export async function updateContentIdea(input: {
  id: string;
  title: string;
  notes: string | null;
  properties: Record<string, string | string[]>;
}) {
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("content_ideas")
    .update({
      title: input.title,
      notes: input.notes,
      properties: input.properties,
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

async function eachMatchingPropertyValue(
  propertyId: string,
  value: string,
  apply: (current: string) => string | null,
) {
  const { supabase, user } = await requireUser();

  const { data: property, error: propError } = await supabase
    .from("content_properties")
    .select("type")
    .eq("id", propertyId)
    .single();
  if (propError) throw new Error(propError.message);
  const isMulti = property.type === "multi_select";

  const { data: rows, error } = await supabase
    .from("content_ideas")
    .select("id, properties")
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  for (const row of rows ?? []) {
    const props = { ...(row.properties as Record<string, string | string[]>) };
    const current = props[propertyId];
    if (current === undefined) continue;

    if (isMulti) {
      const arr = Array.isArray(current) ? current : [];
      if (!arr.includes(value)) continue;
      const next = Array.from(
        new Set(
          arr
            .map((v) => (v === value ? apply(v) : v))
            .filter((v): v is string => Boolean(v)),
        ),
      );
      if (next.length) props[propertyId] = next;
      else delete props[propertyId];
    } else {
      if (current !== value) continue;
      const next = apply(current as string);
      if (next) props[propertyId] = next;
      else delete props[propertyId];
    }

    await supabase
      .from("content_ideas")
      .update({ properties: props })
      .eq("id", row.id);
  }

  revalidatePath("/videos/pipeline");
}

export async function renamePropertyOption(
  propertyId: string,
  oldValue: string,
  newValue: string,
) {
  const trimmed = newValue.trim();
  if (!trimmed || trimmed === oldValue) return;
  await eachMatchingPropertyValue(propertyId, oldValue, () => trimmed);
}

export async function deletePropertyOption(propertyId: string, value: string) {
  await eachMatchingPropertyValue(propertyId, value, () => null);
}

export async function createContentProperty(name: string, type: PropertyType) {
  const { supabase, user } = await requireUser();

  const { data: last } = await supabase
    .from("content_properties")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("content_properties").insert({
    user_id: user.id,
    name,
    type,
    sort_order: (last?.sort_order ?? -1) + 1,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/videos/pipeline");
}

export async function renameContentProperty(id: string, name: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("content_properties")
    .update({ name })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/videos/pipeline");
}

export async function deleteContentProperty(id: string) {
  const { supabase, user } = await requireUser();

  const { data: rows, error: fetchError } = await supabase
    .from("content_ideas")
    .select("id, properties")
    .eq("user_id", user.id);
  if (fetchError) throw new Error(fetchError.message);

  for (const row of rows ?? []) {
    const props = { ...(row.properties as Record<string, string | string[]>) };
    if (!(id in props)) continue;
    delete props[id];
    await supabase
      .from("content_ideas")
      .update({ properties: props })
      .eq("id", row.id);
  }

  const { error } = await supabase
    .from("content_properties")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/videos/pipeline");
}

export async function moveContentProperty(id: string, direction: "up" | "down") {
  const { supabase, user } = await requireUser();

  const { data: all } = await supabase
    .from("content_properties")
    .select("id, sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  const list = all ?? [];
  const index = list.findIndex((p) => p.id === id);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= list.length) return;

  const current = list[index];
  const swap = list[swapIndex];

  await Promise.all([
    supabase
      .from("content_properties")
      .update({ sort_order: swap.sort_order })
      .eq("id", current.id),
    supabase
      .from("content_properties")
      .update({ sort_order: current.sort_order })
      .eq("id", swap.id),
  ]);

  revalidatePath("/videos/pipeline");
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
