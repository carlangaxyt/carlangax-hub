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

export async function saveTradingPlan(content: string) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("trading_plan").upsert(
    {
      user_id: user.id,
      content,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) throw new Error(error.message);
  revalidatePath("/trading/plan");
}

export async function transcribePdfToRules(base64Pdf: string) {
  await requireUser();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Falta ANTHROPIC_API_KEY. Agrega crédito en console.anthropic.com para usar esto.",
    );
  }

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 4096,
    output_config: { effort: "medium" },
    system:
      "Eres un asistente que transcribe planes de trading en PDF a reglas claras y accionables en español. Organiza la salida en secciones con encabezados simples (ej. 'Setups', 'Gestión de riesgo', 'Sesiones', 'Reglas de entrada/salida'), usando viñetas. No agregues comentarios tuyos, solo transcribe y organiza lo que está en el documento.",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64Pdf,
            },
          },
          {
            type: "text",
            text: "Transcribe este plan de trading a reglas organizadas.",
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text",
  );
  return textBlock?.text ?? "";
}
