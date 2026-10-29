"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Direction } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return { supabase, user };
}

function numOrNull(value: FormDataEntryValue | null) {
  if (value === null || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export async function createBacktestingSession(formData: FormData) {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const symbol = String(formData.get("symbol") ?? "")
    .trim()
    .toUpperCase();
  if (!name || !symbol) throw new Error("Nombre y símbolo son obligatorios");

  const startBalance = numOrNull(formData.get("start_balance")) ?? 100000;

  const { data, error } = await supabase
    .from("backtesting_sessions")
    .insert({
      user_id: user.id,
      external_id: `manual-${crypto.randomUUID()}`,
      name,
      symbol,
      start_date: formData.get("start_date") || null,
      end_date: formData.get("end_date") || null,
      start_balance: startBalance,
      current_balance: startBalance,
      net_profit: 0,
      trade_count: 0,
      completion: 0,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/trading/backtesting");
  return data.id as string;
}

export async function deleteBacktestingSession(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("backtesting_sessions")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/trading/backtesting");
}

async function recomputeSessionTotals(sessionId: string) {
  const { supabase } = await requireUser();

  const { data: session } = await supabase
    .from("backtesting_sessions")
    .select("start_balance")
    .eq("id", sessionId)
    .single();
  if (!session) return;

  const { data: trades } = await supabase
    .from("trades")
    .select("pnl")
    .eq("backtesting_session_id", sessionId);

  const closed = (trades ?? []).filter((t) => t.pnl !== null);
  const netProfit = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const startBalance = session.start_balance ?? 100000;

  await supabase
    .from("backtesting_sessions")
    .update({
      trade_count: closed.length,
      net_profit: netProfit,
      current_balance: startBalance + netProfit,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);
}

export async function addBacktestTrade(sessionId: string, formData: FormData) {
  const { supabase, user } = await requireUser();

  const symbol = String(formData.get("symbol") ?? "")
    .trim()
    .toUpperCase();
  if (!symbol) throw new Error("El símbolo es obligatorio");

  const pnl = numOrNull(formData.get("pnl"));
  const result =
    pnl === null ? null : pnl > 0 ? "win" : pnl < 0 ? "loss" : "breakeven";

  const { error } = await supabase.from("trades").insert({
    user_id: user.id,
    symbol,
    direction: String(formData.get("direction") ?? "long") as Direction,
    setup: String(formData.get("setup") ?? "") || null,
    entry: numOrNull(formData.get("entry")),
    exit: numOrNull(formData.get("exit")),
    size: numOrNull(formData.get("size")),
    pnl,
    result,
    notes: String(formData.get("notes") ?? "") || null,
    opened_at: formData.get("opened_at")
      ? new Date(String(formData.get("opened_at"))).toISOString()
      : new Date().toISOString(),
    source: "manual",
    account: "Backtesting",
    account_type: "backtest",
    backtesting_session_id: sessionId,
  });

  if (error) throw new Error(error.message);
  await recomputeSessionTotals(sessionId);
  revalidatePath(`/trading/backtesting/${sessionId}`);
  revalidatePath("/trading/backtesting");
}

export async function deleteBacktestTrade(id: string, sessionId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("trades").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await recomputeSessionTotals(sessionId);
  revalidatePath(`/trading/backtesting/${sessionId}`);
  revalidatePath("/trading/backtesting");
}
