import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { groupBySetup, money } from "@/lib/trading-metrics";
import type { Trade } from "@/lib/types";

export default async function StrategiesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trades")
    .select("*")
    .order("opened_at", { ascending: false });

  const trades = (data ?? []) as Trade[];
  const setups = groupBySetup(trades);
  const maxAbsPnl = Math.max(1, ...setups.map((s) => Math.abs(s.pnl)));

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted">Seguimiento</p>
        <h1 className="text-xl font-semibold">Estrategias</h1>
        <p className="text-sm text-muted">
          Rendimiento por playbook sobre tus {trades.filter((t) => t.pnl !== null).length} trades.
        </p>
      </div>

      {setups.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">Todavía no hay trades con playbook registrado.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {setups.map((s) => (
            <Card key={s.setup} className="p-4">
              <p className="mb-3 text-sm font-semibold">{s.setup}</p>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-muted">Trades</span>
                <span className="font-semibold">{s.count}</span>
              </div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-muted">Win rate</span>
                <span className="font-semibold">{s.winRate.toFixed(1)}%</span>
              </div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-muted">Expectancy</span>
                <span className="font-semibold">{money(s.expectancy)}</span>
              </div>
              <div className="mb-3 flex justify-between text-xs">
                <span className="text-muted">Net P&amp;L</span>
                <span className={cn("font-bold", s.pnl >= 0 ? "text-accent" : "text-danger")}>
                  {money(s.pnl)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className={cn("h-full", s.pnl >= 0 ? "bg-accent" : "bg-danger")}
                  style={{ width: `${(Math.abs(s.pnl) / maxAbsPnl) * 100}%` }}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
