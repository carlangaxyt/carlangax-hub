"use client";

import { useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { askAssistant, type ChatMessage } from "@/lib/actions/assistant";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "¿Cuál es mi win rate este mes?",
  "¿Qué setup me ha dado mejor resultado?",
  "¿En qué sesión pierdo más dinero?",
  "Resume mis últimos 5 trades",
];

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  function send(text: string) {
    if (!text.trim() || pending) return;
    setError(null);
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");

    startTransition(async () => {
      try {
        const reply = await askAssistant(next);
        setMessages((prev) => [...prev, reply]);
        setTimeout(
          () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
          50,
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al contactar al asistente",
        );
      }
    });
  }

  return (
    <div className="flex h-[70vh] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-muted">
              Pregúntame sobre tus trades, videos o recordatorios.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap",
              m.role === "user"
                ? "ml-auto bg-accent text-background"
                : "bg-surface border border-border",
            )}
          >
            {m.content}
          </div>
        ))}

        {pending && (
          <div className="max-w-[85%] rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-muted">
            Pensando...
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-4 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta..."
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex items-center justify-center rounded-lg bg-accent px-4 text-background disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
