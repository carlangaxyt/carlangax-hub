"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PayoutStatus } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return { supabase, user };
}

export async function createPayout(input: {
  prop_firm: string;
  amount: number;
  currency: string;
  payout_date: string;
  status: PayoutStatus;
  notes: string | null;
  proof_path: string | null;
}) {
  const { supabase, user } = await requireUser();

  const { data: last } = await supabase
    .from("payouts")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("payouts").insert({
    user_id: user.id,
    prop_firm: input.prop_firm,
    amount: input.amount,
    currency: input.currency,
    payout_date: input.payout_date,
    status: input.status,
    notes: input.notes,
    proof_path: input.proof_path,
    sort_order: (last?.sort_order ?? 0) + 1,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/trading");
}

export async function updatePayout(input: {
  id: string;
  prop_firm: string;
  amount: number;
  currency: string;
  payout_date: string;
  status: PayoutStatus;
  notes: string | null;
  new_proof_path?: string;
  old_proof_path?: string | null;
}) {
  const { supabase } = await requireUser();

  if (input.new_proof_path && input.old_proof_path) {
    await supabase.storage.from("certificates").remove([input.old_proof_path]);
  }

  const { error } = await supabase
    .from("payouts")
    .update({
      prop_firm: input.prop_firm,
      amount: input.amount,
      currency: input.currency,
      payout_date: input.payout_date,
      status: input.status,
      notes: input.notes,
      ...(input.new_proof_path ? { proof_path: input.new_proof_path } : {}),
    })
    .eq("id", input.id);

  if (error) throw new Error(error.message);
  revalidatePath("/trading");
}

export async function deletePayout(id: string, proofPath: string | null) {
  const { supabase } = await requireUser();

  if (proofPath) {
    await supabase.storage.from("certificates").remove([proofPath]);
  }

  const { error } = await supabase.from("payouts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/trading");
}

export async function movePayout(id: string, direction: "up" | "down") {
  const { supabase, user } = await requireUser();

  const { data: all } = await supabase
    .from("payouts")
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
      .from("payouts")
      .update({ sort_order: swap.sort_order })
      .eq("id", current.id),
    supabase
      .from("payouts")
      .update({ sort_order: current.sort_order })
      .eq("id", swap.id),
  ]);

  revalidatePath("/trading");
}

export async function createChallengeCertificate(input: {
  prop_firm: string;
  challenge_name: string;
  passed_date: string | null;
  certificate_path: string;
  notes: string | null;
}) {
  const { supabase, user } = await requireUser();

  const { data: last } = await supabase
    .from("challenge_certificates")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("challenge_certificates").insert({
    user_id: user.id,
    prop_firm: input.prop_firm,
    challenge_name: input.challenge_name,
    ...(input.passed_date ? { passed_date: input.passed_date } : {}),
    certificate_path: input.certificate_path,
    notes: input.notes,
    sort_order: (last?.sort_order ?? 0) + 1,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/trading");
}

export async function updateChallengeCertificate(input: {
  id: string;
  prop_firm: string;
  challenge_name: string;
  passed_date: string | null;
  notes: string | null;
  new_certificate_path?: string;
  old_certificate_path?: string;
}) {
  const { supabase } = await requireUser();

  if (input.new_certificate_path && input.old_certificate_path) {
    await supabase.storage
      .from("certificates")
      .remove([input.old_certificate_path]);
  }

  const { error } = await supabase
    .from("challenge_certificates")
    .update({
      prop_firm: input.prop_firm,
      challenge_name: input.challenge_name,
      ...(input.passed_date ? { passed_date: input.passed_date } : {}),
      notes: input.notes,
      ...(input.new_certificate_path
        ? { certificate_path: input.new_certificate_path }
        : {}),
    })
    .eq("id", input.id);

  if (error) throw new Error(error.message);
  revalidatePath("/trading");
}

export async function deleteChallengeCertificate(
  id: string,
  certificatePath: string,
) {
  const { supabase } = await requireUser();

  await supabase.storage.from("certificates").remove([certificatePath]);

  const { error } = await supabase
    .from("challenge_certificates")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/trading");
}

export async function moveChallengeCertificate(
  id: string,
  direction: "up" | "down",
) {
  const { supabase, user } = await requireUser();

  const { data: all } = await supabase
    .from("challenge_certificates")
    .select("id, sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  const list = all ?? [];
  const index = list.findIndex((c) => c.id === id);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= list.length) return;

  const current = list[index];
  const swap = list[swapIndex];

  await Promise.all([
    supabase
      .from("challenge_certificates")
      .update({ sort_order: swap.sort_order })
      .eq("id", current.id),
    supabase
      .from("challenge_certificates")
      .update({ sort_order: current.sort_order })
      .eq("id", swap.id),
  ]);

  revalidatePath("/trading");
}

export async function getCertificateUrl(path: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.storage
    .from("certificates")
    .createSignedUrl(path, 60 * 60);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
