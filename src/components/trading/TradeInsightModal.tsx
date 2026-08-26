"use client";

import Image from "next/image";
import { format } from "date-fns";
import { AlertCircle, CheckCircle2, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Trade } from "@/lib/types";

export function TradeInsightModal({
  trade,
  onClose,
}: {
  trade: Trade;
  onClose: () => void;
}) {
  const score = trade.ai_score ?? 0;
  const scorePct = Math.max(0, Math.min(100, ((score - 1) / 9) * 100));

  const Icon = score >= 7 ? CheckCircle2 : score >= 4 ? AlertCircle : XCircle;
  const iconColor =
    score >= 7 ? "text-accent" : score >= 4 ? "text-gold" : "text-danger";
  const iconBg =
    score >= 7 ? "bg-accent/15" : score >= 4 ? "bg-gold/15" : "bg-danger/15";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Carlangax Ai</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-16 w-16 overflow-hidden rounded-full ring-2 ring-accent/40">
            <Image
              src="/assistant-avatar.png"
              alt="Carlangax Ai"
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          </div>

          <p className="bg-gradient-to-r from-accent to-gold bg-clip-text text-2xl font-semibold text-transparent">
            Carlangax Ai
          </p>

          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{trade.symbol}</span>
            <span className="text-muted">
              {format(new Date(trade.opened_at), "EEE, d MMM yyyy")}
            </span>
            <span className="text-border">|</span>
            <span
              className={cn(
                "font-medium",
                trade.pnl !== null &&
                  (trade.pnl >= 0 ? "text-accent" : "text-danger"),
              )}
            >
              Net P&L {trade.pnl !== null ? trade.pnl.toFixed(2) : "—"}
            </span>
          </div>

          <div className="w-full">
            <p className="mb-2 text-xs text-muted">Escala IA</p>
            <div className="relative h-1 w-full rounded-full bg-gradient-to-r from-danger to-accent">
              <div
                className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-foreground"
                style={{ left: `${scorePct}%` }}
              />
            </div>
          </div>
        </div>

        <div
          className={cn(
            "mt-6 rounded-xl border border-border p-4 text-left",
            iconBg,
          )}
        >
          <div className="mb-2 flex items-center gap-2">
            <Icon size={18} className={iconColor} />
            <p className="font-semibold">
              {trade.ai_headline ?? "Sin título"}
            </p>
          </div>
          <p className="text-sm text-muted">
            {trade.ai_summary ?? "Sin resumen disponible."}
          </p>
        </div>
      </div>
    </div>
  );
}
