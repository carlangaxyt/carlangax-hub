"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { disconnectBroker } from "@/lib/actions/portfolio";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { PortfolioData } from "@/lib/actions/portfolio";

function money(value: unknown) {
  const n = typeof value === "string" ? parseFloat(value) : (value as number);
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function PortfolioView({
  data,
  error,
}: {
  data: PortfolioData | null;
  error?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!data) {
    return (
      <Card className="space-y-4 text-center">
        <p className="text-sm text-muted">
          Conecta tu cuenta de TradeStation en modo solo lectura para ver tu
          equity y posiciones aquí.
        </p>
        {error && <p className="text-sm text-danger">Error: {error}</p>}
        <a href="/portfolio/connect">
          <Button className="mx-auto">Conectar TradeStation</Button>
        </a>
      </Card>
    );
  }

  const equity = data.balance?.Equity ?? data.balance?.MarketValue;
  const pnl = data.balance?.TodaysProfitLoss;
  const pnlNum =
    typeof pnl === "string" ? parseFloat(pnl) : (pnl as number | undefined);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-xs text-muted">Equity</p>
          <p className="mt-1 text-2xl font-semibold">{money(equity)}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted">P&L de hoy</p>
          <p
            className={cn(
              "mt-1 text-2xl font-semibold",
              pnlNum !== undefined && !Number.isNaN(pnlNum)
                ? pnlNum >= 0
                  ? "text-accent"
                  : "text-danger"
                : "text-foreground",
            )}
          >
            {money(pnl)}
          </p>
        </Card>
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Posiciones</h2>
          <button
            onClick={() =>
              startTransition(async () => {
                await disconnectBroker();
                router.refresh();
              })
            }
            disabled={pending}
            className="text-xs text-muted hover:text-danger"
          >
            Desconectar
          </button>
        </div>

        {data.positions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            No hay posiciones abiertas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted">
                  <th className="py-2 pr-3 font-medium">Símbolo</th>
                  <th className="py-2 pr-3 font-medium">Cantidad</th>
                  <th className="py-2 pr-3 font-medium">Precio prom.</th>
                  <th className="py-2 pr-3 font-medium">Último</th>
                  <th className="py-2 pr-3 font-medium">Valor mercado</th>
                  <th className="py-2 pr-3 font-medium">P&L</th>
                </tr>
              </thead>
              <tbody>
                {data.positions.map((p, i) => {
                  const upl =
                    typeof p.UnrealizedProfitLoss === "string"
                      ? parseFloat(p.UnrealizedProfitLoss)
                      : (p.UnrealizedProfitLoss as number | undefined);
                  return (
                    <tr key={i} className="border-b border-border/60">
                      <td className="py-2 pr-3 font-medium">{p.Symbol}</td>
                      <td className="py-2 pr-3 text-muted">
                        {p.Quantity ?? "—"}
                      </td>
                      <td className="py-2 pr-3 text-muted">
                        {money(p.AveragePrice)}
                      </td>
                      <td className="py-2 pr-3 text-muted">{money(p.Last)}</td>
                      <td className="py-2 pr-3">{money(p.MarketValue)}</td>
                      <td
                        className={cn(
                          "py-2 pr-3",
                          upl !== undefined &&
                            !Number.isNaN(upl) &&
                            (upl >= 0 ? "text-accent" : "text-danger"),
                        )}
                      >
                        {money(p.UnrealizedProfitLoss)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
