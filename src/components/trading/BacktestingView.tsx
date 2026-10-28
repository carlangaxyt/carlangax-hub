"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { TradingViewChart, toTradingViewSymbol } from "@/components/trading/TradingViewChart";

export function BacktestingView({ symbols }: { symbols: string[] }) {
  const [symbol, setSymbol] = useState(symbols[0] ?? "ES");

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Gráfico — TradingView</p>
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="rounded-md border border-border bg-background px-2 py-1 text-xs"
        >
          {symbols.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <TradingViewChart symbol={toTradingViewSymbol(symbol)} />
      <p className="mt-2 text-[11px] text-muted">
        Widget gratuito de TradingView para analizar el símbolo mientras repasas tus sesiones de backtesting.
        El replay/strategy tester real es parte de su plataforma de pago y no se puede embeber aquí.
      </p>
    </Card>
  );
}
