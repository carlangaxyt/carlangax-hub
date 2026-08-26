"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { deleteTrade } from "@/lib/actions/trades";
import { cn } from "@/lib/utils";
import { TradeInsightModal } from "@/components/trading/TradeInsightModal";
import type { Trade } from "@/lib/types";

export function TradeTable({ trades }: { trades: Trade[] }) {
  const [, startTransition] = useTransition();
  const [insightTrade, setInsightTrade] = useState<Trade | null>(null);

  if (trades.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        No hay trades registrados todavía.
      </p>
    );
  }

  return (
    <>
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
              <th className="py-2 pr-3 font-medium">R</th>
              <th className="py-2 pr-3 font-medium">P&L</th>
              <th className="py-2 pr-3 font-medium">IA</th>
              <th className="py-2 pr-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr key={trade.id} className="border-b border-border/60">
                <td className="py-2 pr-3 text-muted">
                  {format(new Date(trade.opened_at), "d MMM")}
                </td>
                <td className="py-2 pr-3 font-medium">{trade.symbol}</td>
                <td className="py-2 pr-3">
                  <span
                    className={cn(
                      trade.direction === "long" ? "text-accent" : "text-danger",
                    )}
                  >
                    {trade.direction === "long" ? "Long" : "Short"}
                  </span>
                </td>
                <td
                  className={cn(
                    "py-2 pr-3 text-muted",
                    trade.notes && "cursor-help underline decoration-dotted",
                  )}
                  title={trade.notes ?? undefined}
                >
                  {trade.setup ?? "—"}
                </td>
                <td className="py-2 pr-3 text-muted">
                  {trade.entry !== null ? trade.entry : "—"}
                </td>
                <td className="py-2 pr-3 text-muted">
                  {trade.exit !== null ? trade.exit : "—"}
                </td>
                <td className="py-2 pr-3">
                  {trade.r_multiple !== null ? trade.r_multiple.toFixed(2) : "—"}
                </td>
                <td
                  className={cn(
                    "py-2 pr-3",
                    trade.pnl !== null &&
                      (trade.pnl >= 0 ? "text-accent" : "text-danger"),
                  )}
                >
                  {trade.pnl !== null ? trade.pnl.toFixed(2) : "—"}
                </td>
                <td className="py-2 pr-3">
                  {trade.ai_score !== null ? (
                    <button
                      onClick={() => setInsightTrade(trade)}
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        trade.ai_score >= 7
                          ? "bg-accent/10 text-accent"
                          : trade.ai_score >= 4
                            ? "bg-gold/10 text-gold"
                            : "bg-danger/10 text-danger",
                      )}
                    >
                      {trade.ai_score}/10
                    </button>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="py-2 pr-3 text-right">
                  <button
                    onClick={() => startTransition(() => deleteTrade(trade.id))}
                    className="text-muted hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {insightTrade && (
        <TradeInsightModal
          trade={insightTrade}
          onClose={() => setInsightTrade(null)}
        />
      )}
    </>
  );
}
