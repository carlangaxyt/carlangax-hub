"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { VideoCategory } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return { supabase, user };
}

export async function createVideoRecord(input: {
  title: string;
  description: string | null;
  category: VideoCategory;
  tags: string[];
  storage_path: string;
}) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("videos").insert({
    user_id: user.id,
    title: input.title,
    description: input.description,
    category: input.category,
    tags: input.tags,
    storage_path: input.storage_path,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/videos");
}

export async function deleteVideo(id: string, storagePath: string) {
  const { supabase } = await requireUser();

  const { error: storageError } = await supabase.storage
    .from("videos")
    .remove([storagePath]);
  if (storageError) throw new Error(storageError.message);

  const { error } = await supabase.from("videos").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/videos");
}

export async function getVideoUrl(storagePath: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.storage
    .from("videos")
    .createSignedUrl(storagePath, 60 * 60);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
