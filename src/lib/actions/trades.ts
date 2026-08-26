"use server";

import Anthropic from "@anthropic-ai/sdk";
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

interface TradeForScoring {
  symbol: string;
  direction: Direction;
  session: string | null;
  setup: string | null;
  entry: number | null;
  exit: number | null;
  r_multiple: number | null;
  pnl: number | null;
  notes: string | null;
}

async function scoreTradeWithAI(
  trade: TradeForScoring,
  recentTrades: unknown[],
) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 600,
      output_config: { effort: "low" },
      system:
        "Eres un coach de trading, en el estilo de 'Zella Insights' de TradeZella: evalúas un trade cerrado comparándolo contra los trades recientes del usuario para detectar patrones (errores repetidos, consistencia con setups que le funcionan, etc). " +
        "Respondes SOLO con un objeto JSON válido, sin texto antes ni después, con esta forma exacta: " +
        '{"score": <entero 1-10, calidad de ejecución>, "headline": "<título corto de 3-6 palabras en español, ej. \'Salida anticipada de ganador\'>", "summary": "<2-3 frases en español evaluando el trade y compará­ndolo con el patrón visto en los trades recientes>"}.',
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            trade,
            recent_trades_context: recentTrades,
          }),
        },
      ],
    });

    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text",
    );
    if (!textBlock) return null;

    const parsed = JSON.parse(textBlock.text) as {
      score: number;
      headline: string;
      summary: string;
    };
    if (
      typeof parsed.score !== "number" ||
      typeof parsed.headline !== "string" ||
      typeof parsed.summary !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function createTrade(formData: FormData) {
  const { supabase, user } = await requireUser();

  const symbol = String(formData.get("symbol") ?? "")
    .trim()
    .toUpperCase();
  if (!symbol) throw new Error("El símbolo es obligatorio");

  const trade: TradeForScoring = {
    symbol,
    direction: String(formData.get("direction") ?? "long") as Direction,
    session: String(formData.get("session") ?? "") || null,
    setup: String(formData.get("setup") ?? "") || null,
    entry: numOrNull(formData.get("entry")),
    exit: numOrNull(formData.get("exit")),
    r_multiple: numOrNull(formData.get("r_multiple")),
    pnl: numOrNull(formData.get("pnl")),
    notes: String(formData.get("notes") ?? "") || null,
  };

  let insight: { score: number; headline: string; summary: string } | null =
    null;
  if (trade.pnl !== null) {
    const { data: recent } = await supabase
      .from("trades")
      .select(
        "symbol, direction, setup, r_multiple, pnl, notes, opened_at",
      )
      .eq("user_id", user.id)
      .order("opened_at", { ascending: false })
      .limit(20);
    insight = await scoreTradeWithAI(trade, recent ?? []);
  }

  const { error } = await supabase.from("trades").insert({
    user_id: user.id,
    ...trade,
    size: numOrNull(formData.get("size")),
    ai_score: insight?.score ?? null,
    ai_headline: insight?.headline ?? null,
    ai_summary: insight?.summary ?? null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/trading");
  revalidatePath("/dashboard");
}

export async function bulkImportTrades(
  trades: {
    opened_at: string;
    symbol: string;
    direction: Direction;
    r_multiple: number | null;
    pnl: number | null;
    entry?: number | null;
    exit?: number | null;
    setup?: string | null;
    notes?: string | null;
  }[],
) {
  const { supabase, user } = await requireUser();

  const { data: existing } = await supabase
    .from("trades")
    .select("symbol, opened_at");

  const existingKeys = new Set(
    (existing ?? []).map((t) => `${t.symbol}|${t.opened_at.slice(0, 10)}`),
  );

  const toInsert = trades
    .filter((t) => !existingKeys.has(`${t.symbol}|${t.opened_at}`))
    .map((t) => ({
      user_id: user.id,
      symbol: t.symbol,
      direction: t.direction,
      r_multiple: t.r_multiple,
      pnl: t.pnl,
      entry: t.entry ?? null,
      exit: t.exit ?? null,
      setup: t.setup ?? null,
      notes: t.notes ?? null,
      opened_at: new Date(t.opened_at).toISOString(),
    }));

  let insertedIds: string[] = [];
  if (toInsert.length > 0) {
    const { data, error } = await supabase
      .from("trades")
      .insert(toInsert)
      .select("id");
    if (error) throw new Error(error.message);
    insertedIds = (data ?? []).map((t) => t.id);
  }

  revalidatePath("/trading");
  revalidatePath("/dashboard");
  return {
    imported: toInsert.length,
    skipped: trades.length - toInsert.length,
    insertedIds,
  };
}

export async function deleteTrade(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("trades").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/trading");
  revalidatePath("/dashboard");
}
