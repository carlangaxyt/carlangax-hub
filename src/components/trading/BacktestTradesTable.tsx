"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { deleteBacktestTrade } from "@/lib/actions/backtesting";
import { cn } from "@/lib/utils";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import type { Trade } from "@/lib/types";

export function BacktestTradesTable({
  trades,
  sessionId,
}: {
  trades: Trade[];
  sessionId: string;
}) {
  const [, startTransition] = useTransition();

  if (trades.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted">
        Todavía no agregaste trades a esta sesión.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted">
            <th className="py-2 pr-3 font-medium">Fecha</th>
            <th className="py-2 pr-3 font-medium">Símbolo</th>
            <th className="py-2 pr-3 font-medium">Dir</th>
            <th className="py-2 pr-3 font-medium">Setup</th>
            <th className="py-2 pr-3 font-medium">Entry</th>
            <th className="py-2 pr-3 font-medium">Exit</th>
            <th className="py-2 pr-3 font-medium">P&L</th>
            <th className="py-2 pr-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => (
            <tr key={t.id} className="border-b border-border/60">
              <td className="py-2 pr-3 text-muted">
                {format(new Date(t.opened_at), "d MMM yyyy")}
              </td>
              <td className="py-2 pr-3 font-medium">{t.symbol}</td>
              <td className="py-2 pr-3">
                <span className={cn(t.direction === "long" ? "text-accent" : "text-danger")}>
                  {t.direction === "long" ? "Long" : "Short"}
                </span>
              </td>
              <td className="py-2 pr-3 text-muted">{t.setup ?? "—"}</td>
              <td className="py-2 pr-3 text-muted">{t.entry ?? "—"}</td>
              <td className="py-2 pr-3 text-muted">{t.exit ?? "—"}</td>
              <td
                className={cn(
                  "py-2 pr-3 font-semibold",
                  t.pnl !== null && (t.pnl >= 0 ? "text-accent" : "text-danger"),
                )}
              >
                {t.pnl !== null ? t.pnl.toFixed(2) : "—"}
              </td>
              <td className="py-2 pr-3 text-right">
                <ConfirmDeleteButton
                  onConfirm={() =>
                    startTransition(() => deleteBacktestTrade(t.id, sessionId))
                  }
                  label="Eliminar trade"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
