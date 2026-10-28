import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { BacktestingView } from "@/components/trading/BacktestingView";
import { cn } from "@/lib/utils";
import type { BacktestingSession } from "@/lib/types";

function money(v: number) {
  const sign = v > 0 ? "+" : v < 0 ? "-" : "";
  return `${sign}$${Math.abs(v).toLocaleString("es", { maximumFractionDigits: 0 })}`;
}

export default async function BacktestingPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("backtesting_sessions")
    .select("*")
    .order("net_profit", { ascending: false });

  const sessions = (data ?? []) as BacktestingSession[];
  const symbols = Array.from(new Set(sessions.map((s) => s.symbol))).sort();

  const totalNet = sessions.reduce((s, x) => s + (x.net_profit ?? 0), 0);
  const avgCompletion = sessions.length
    ? sessions.reduce((s, x) => s + (x.completion ?? 0), 0) / sessions.length
    : 0;
  const totalTrades = sessions.reduce((s, x) => s + x.trade_count, 0);
  const best = sessions[0];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted">Seguimiento</p>
        <h1 className="text-xl font-semibold">Backtesting</h1>
        <p className="text-sm text-muted">
          {sessions.length} sesiones reales sincronizadas desde TradeZella, {totalTrades} trades simulados en total.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4">
          <p className="mb-2 text-[11px] text-muted">Sesiones</p>
          <p className="text-lg font-bold">{sessions.length}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-[11px] text-muted">Net profit total</p>
          <p className={cn("text-lg font-bold", totalNet >= 0 ? "text-accent" : "text-danger")}>
            {money(totalNet)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-[11px] text-muted">Completitud promedio</p>
          <p className="text-lg font-bold">{avgCompletion.toFixed(1)}%</p>
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-[11px] text-muted">Mejor sesión</p>
          <p className="truncate text-sm font-bold text-accent" title={best?.name}>
            {best?.name ?? "—"}
          </p>
        </Card>
      </div>

      {symbols.length > 0 && <BacktestingView symbols={symbols} />}

      <Card>
        <p className="mb-3 text-sm font-semibold">Sesiones de backtesting</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th className="py-2 pr-3 font-medium">Sesión</th>
                <th className="py-2 pr-3 font-medium">Símbolo</th>
                <th className="py-2 pr-3 font-medium">Periodo</th>
                <th className="py-2 pr-3 font-medium">Trades</th>
                <th className="py-2 pr-3 font-medium">Completitud</th>
                <th className="py-2 pr-3 font-medium">Playbook</th>
                <th className="py-2 pr-3 text-right font-medium">Net P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-b border-border/60">
                  <td className="py-2 pr-3 font-medium">{s.name}</td>
                  <td className="py-2 pr-3 text-muted">{s.symbol}</td>
                  <td className="py-2 pr-3 text-muted">
                    {s.start_date ?? "—"} → {s.end_date ?? "—"}
                  </td>
                  <td className="py-2 pr-3 text-muted">{s.trade_count}</td>
                  <td className="py-2 pr-3 text-muted">
                    {s.completion !== null ? `${s.completion.toFixed(1)}%` : "—"}
                  </td>
                  <td className="py-2 pr-3 text-muted">{s.playbooks ?? "—"}</td>
                  <td
                    className={cn(
                      "py-2 pr-3 text-right font-semibold",
                      (s.net_profit ?? 0) >= 0 ? "text-accent" : "text-danger",
                    )}
                  >
                    {s.net_profit !== null ? money(s.net_profit) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
