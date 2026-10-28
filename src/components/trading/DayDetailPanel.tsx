"use client";

import { useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { money } from "@/lib/trading-metrics";
import { saveDailyJournalEntry } from "@/lib/actions/daily-journal";
import type { Trade } from "@/lib/types";

export function DayDetailPanel({
  date,
  trades,
  initialNote,
}: {
  date: string;
  trades: Trade[];
  initialNote: string;
}) {
  const [note, setNote] = useState(initialNote);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const pnl = trades.reduce((s, t) => s + (t.pnl ?? 0), 0);

  function handleSave() {
    startTransition(async () => {
      await saveDailyJournalEntry(date, note);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <Card className="self-start">
      <p className="text-xs text-muted">
        {format(parseISO(date), "EEEE", { locale: es })}
      </p>
      <p className="mb-3 text-base font-semibold">
        {format(parseISO(date), "d 'de' MMMM, yyyy", { locale: es })}
      </p>

      <div className="mb-4 flex gap-2.5">
        <div className="flex-1 rounded-lg border border-border bg-background p-2.5">
          <p className="text-[10px] text-muted">P&amp;L del día</p>
          <p className={cn("text-sm font-bold", pnl >= 0 ? "text-accent" : "text-danger")}>
            {money(pnl)}
          </p>
        </div>
        <div className="flex-1 rounded-lg border border-border bg-background p-2.5">
          <p className="text-[10px] text-muted">Trades</p>
          <p className="text-sm font-bold">{trades.length}</p>
        </div>
      </div>

      <div className="mb-4 flex max-h-56 flex-col gap-2 overflow-y-auto">
        {trades.length === 0 && (
          <p className="text-xs text-muted">Sin trades este día.</p>
        )}
        {trades.map((t) => (
          <div key={t.id} className="rounded-lg border border-border p-2.5">
            <div className="flex justify-between text-xs font-semibold">
              <span>{t.symbol}</span>
              <span className={cn(t.pnl !== null && t.pnl >= 0 ? "text-accent" : "text-danger")}>
                {t.pnl !== null ? money(t.pnl) : "—"}
              </span>
            </div>
            <p className="text-[11px] text-muted">
              {t.direction === "long" ? "Long" : "Short"}
              {t.account ? ` · ${t.account}` : ""}
              {t.setup ? ` · ${t.setup}` : ""}
            </p>
          </div>
        ))}
      </div>

      <label className="mb-1.5 block text-xs text-muted" htmlFor="day-note">
        Nota del día
      </label>
      <textarea
        id="day-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="¿Qué pasó en la sesión de hoy?"
        className="min-h-[100px] w-full resize-y rounded-lg border border-border bg-background p-2.5 text-sm text-foreground outline-none focus:border-accent"
      />
      <button
        onClick={handleSave}
        disabled={isPending}
        className="mt-2 w-full rounded-lg border border-border bg-background py-2 text-xs font-semibold hover:border-accent disabled:opacity-60"
      >
        {saved ? "Guardado" : isPending ? "Guardando…" : "Guardar nota"}
      </button>
    </Card>
  );
}
