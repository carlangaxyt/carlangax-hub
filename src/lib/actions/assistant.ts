"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import type { Trade, Video, Reminder } from "@/lib/types";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

async function buildContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const [{ data: trades }, { data: videos }, { data: reminders }] =
    await Promise.all([
      supabase
        .from("trades")
        .select("*")
        .order("opened_at", { ascending: false })
        .limit(300),
      supabase
        .from("videos")
        .select("id, title, category, tags, related_trade_id, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("reminders")
        .select("*")
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(100),
    ]);

  const t = (trades ?? []) as Trade[];
  const v = (videos ?? []) as Pick<
    Video,
    "id" | "title" | "category" | "tags" | "related_trade_id" | "created_at"
  >[];
  const r = (reminders ?? []) as Reminder[];

  const closed = t.filter((x) => x.pnl !== null);
  const wins = closed.filter((x) => (x.pnl ?? 0) > 0).length;
  const totalPnl = closed.reduce((sum, x) => sum + (x.pnl ?? 0), 0);

  const summary = {
    stats: {
      total_trades: t.length,
      closed_trades: closed.length,
      win_rate: closed.length ? Math.round((wins / closed.length) * 100) : 0,
      total_pnl: Number(totalPnl.toFixed(2)),
    },
    trades: t.map((x) => ({
      date: x.opened_at,
      symbol: x.symbol,
      direction: x.direction,
      session: x.session,
      setup: x.setup,
      entry: x.entry,
      exit: x.exit,
      r_multiple: x.r_multiple,
      pnl: x.pnl,
      notes: x.notes,
    })),
    videos: v.map((x) => ({
      date: x.created_at,
      title: x.title,
      category: x.category,
      tags: x.tags,
      related_trade_id: x.related_trade_id,
    })),
    reminders: r.map((x) => ({
      title: x.title,
      due_at: x.due_at,
      priority: x.priority,
      done: x.done,
    })),
  };

  return JSON.stringify(summary);
}

export async function askAssistant(
  history: ChatMessage[],
): Promise<ChatMessage> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Falta ANTHROPIC_API_KEY en .env.local. Agrega tu key de console.anthropic.com y reinicia el servidor.",
    );
  }

  const context = await buildContext();
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    system: `Eres el asistente personal de trading dentro de Carlangax Hub. Tienes acceso a los datos reales del usuario (trades, videos y recordatorios) en formato JSON a continuación. Responde en español, de forma directa y basada en los datos. Si te preguntan algo que no puedes calcular con estos datos, dilo claramente.\n\nDATOS:\n${context}`,
    messages: history.map((m) => ({ role: m.role, content: m.content })),
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  return { role: "assistant", content: text };
}
