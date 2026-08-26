"use server";

import Anthropic from "@anthropic-ai/sdk";
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

const SYSTEM_PROMPT =
  "Eres un coach de trading, en el estilo de 'Zella Insights' de TradeZella, que conoce el plan de trading del usuario y su historial. " +
  "Te doy: el plan de trading (puede estar vacío), un resumen de trades anteriores como contexto, y una lista de trades nuevos que se acaban de importar. " +
  "Responde SOLO con un objeto JSON válido, sin texto antes ni después, con esta forma exacta: " +
  '{"trades": [{"id": "<id del trade>", "score": <entero 1-10>, "headline": "<título corto de 3-6 palabras en español, ej. \'Salida anticipada de ganador\'>", "note": "<2-3 frases en español evaluando ese trade, comparándolo con los patrones vistos en el historial>"}], "pattern_summary": "<2-4 frases en español evaluando el conjunto: consistencia con el plan, patrones repetidos, desviaciones detectadas>"}. ' +
  "Incluye una entrada en 'trades' por cada trade nuevo, en el mismo orden.";

async function buildAnalysisPayload(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  tradeIds: string[],
) {
  let recentQuery = supabase
    .from("trades")
    .select(
      "symbol, direction, session, setup, r_multiple, pnl, notes, opened_at",
    )
    .eq("user_id", userId)
    .order("opened_at", { ascending: false })
    .limit(30);

  if (tradeIds.length > 0) {
    recentQuery = recentQuery.not("id", "in", `(${tradeIds.join(",")})`);
  }

  const [{ data: plan }, { data: recent }, { data: newTrades }] =
    await Promise.all([
      supabase
        .from("trading_plan")
        .select("content")
        .eq("user_id", userId)
        .maybeSingle(),
      recentQuery,
      supabase
        .from("trades")
        .select(
          "id, symbol, direction, session, setup, r_multiple, pnl, notes, opened_at",
        )
        .in("id", tradeIds),
    ]);

  const userContent = JSON.stringify({
    trading_plan: plan?.content ?? "",
    recent_trades_context: recent ?? [],
    new_trades: newTrades ?? [],
  });

  return { system: SYSTEM_PROMPT, userContent, newTrades: newTrades ?? [] };
}

export async function estimateAnalysisCost(tradeIds: string[]) {
  const { supabase, user } = await requireUser();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { available: false as const };
  }

  const { system, userContent, newTrades } = await buildAnalysisPayload(
    supabase,
    user.id,
    tradeIds,
  );

  const client = new Anthropic({ apiKey });
  const count = await client.messages.countTokens({
    model: "claude-opus-5",
    system,
    messages: [{ role: "user", content: userContent }],
  });

  const inputTokens = count.input_tokens;
  const estimatedOutputTokens = newTrades.length * 60 + 250;

  const inputCost = (inputTokens / 1_000_000) * 5;
  const outputCost = (estimatedOutputTokens / 1_000_000) * 25;

  return {
    available: true as const,
    tradeCount: newTrades.length,
    estimatedCost: inputCost + outputCost,
  };
}

export async function analyzeImportedTrades(tradeIds: string[]) {
  const { supabase, user } = await requireUser();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Falta ANTHROPIC_API_KEY. Agrega crédito en console.anthropic.com para usar esto.",
    );
  }

  const { system, userContent, newTrades } = await buildAnalysisPayload(
    supabase,
    user.id,
    tradeIds,
  );

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: Math.max(1000, newTrades.length * 80 + 400),
    output_config: { effort: "medium" },
    system,
    messages: [{ role: "user", content: userContent }],
  });

  const textBlock = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text",
  );
  if (!textBlock) throw new Error("Respuesta vacía de la IA");

  const parsed = JSON.parse(textBlock.text) as {
    trades: { id: string; score: number; headline: string; note: string }[];
    pattern_summary: string;
  };

  await Promise.all(
    parsed.trades.map((t) =>
      supabase
        .from("trades")
        .update({
          ai_score: t.score,
          ai_headline: t.headline,
          ai_summary: t.note,
        })
        .eq("id", t.id)
        .eq("user_id", user.id),
    ),
  );

  await supabase.from("trade_insights").insert({
    user_id: user.id,
    summary: parsed.pattern_summary,
    trade_count: newTrades.length,
  });

  revalidatePath("/trading/trades");
  revalidatePath("/trading/plan");

  return { summary: parsed.pattern_summary, tradeCount: newTrades.length };
}
