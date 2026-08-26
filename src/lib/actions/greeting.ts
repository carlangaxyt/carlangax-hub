"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const FALLBACKS = [
  "Buenos días campeón, ¿qué tenemos para hoy?",
  "Ey Carlangax, vamos con todo hoy 💪",
  "¿Listo para romperla hoy, rey?",
  "Dale que hoy se opera con cabeza fría, campeón.",
  "A ver Carlangax, ¿qué trae el mercado hoy?",
  "Buen día, jefe. Vamos a ver esos charts.",
];

function randomFallback() {
  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}

export async function generateGreeting(hourLocal: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return randomFallback();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return randomFallback();

  const timeOfDay =
    hourLocal < 12 ? "mañana" : hourLocal < 19 ? "tarde" : "noche";

  try {
    const [{ count: pendingReminders }, { data: recentTrades }] =
      await Promise.all([
        supabase
          .from("reminders")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("done", false),
        supabase
          .from("trades")
          .select("pnl")
          .eq("user_id", user.id)
          .order("opened_at", { ascending: false })
          .limit(10),
      ]);

    const closed = (recentTrades ?? []).filter((t) => t.pnl !== null);
    const wins = closed.filter((t) => (t.pnl ?? 0) > 0).length;

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 60,
      output_config: { effort: "low" },
      system:
        "Escribes UN saludo corto (máximo 14 palabras) para 'Carlangax', un trader. Tono jocoso, cercano, informal, tipo 'campeón'/'rey'/'jefe', en español latino casual, como hablaría un amigo cercano de confianza. Nada de comillas, máximo un emoji. Responde solo con el saludo, nada más, sin explicaciones.",
      messages: [
        {
          role: "user",
          content: `Momento del día: ${timeOfDay}. Recordatorios pendientes: ${pendingReminders ?? 0}. De sus últimos ${closed.length} trades cerrados, ${wins} fueron ganadores.`,
        },
      ],
    });

    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text",
    );
    const text = textBlock?.text.trim();
    return text || randomFallback();
  } catch {
    return randomFallback();
  }
}
