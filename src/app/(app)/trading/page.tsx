import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { TradeTable } from "@/components/trading/TradeTable";
import { EquityCurveChart } from "@/components/trading/TradingCharts";
import {
  ScoreRadar,
  DrawdownChart,
  DailyBarsChart,
} from "@/components/trading/DashboardCharts";
import {
  computeEquityPoints,
  computeDrawdownPoints,
  computeStats,
  tradingScore,
  money,
} from "@/lib/trading-metrics";
import { cn } from "@/lib/utils";
import type { Trade } from "@/lib/types";

const SCOPES = [
  { key: "live", label: "Live" },
  { key: "backtest", label: "Backtesting" },
  { key: "all", label: "Todas" },
] as const;

export default async function TradingDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const { scope: scopeParam } = await searchParams;
  const scope = (["live", "backtest", "all"] as const).includes(
    scopeParam as "live" | "backtest" | "all",
  )
    ? (scopeParam as "live" | "backtest" | "all")
    : "live";

  const supabase = await createClient();
  const { data } = await supabase
    .from("trades")
    .select("*")
    .order("opened_at", { ascending: false });

  const all = (data ?? []) as Trade[];
  const trades = all.filter((t) => {
    if (scope === "all") return true;
    if (scope === "backtest") return t.account_type === "backtest";
    // "live": cuentas live o trades manuales sin account_type (siempre se consideran reales)
    return t.account_type === "live" || t.account_type === null;
  });

  const stats = computeStats(trades);
  const score = tradingScore(trades);
  const equityPoints = computeEquityPoints(trades);
  const drawdownPoints = computeDrawdownPoints(trades);
  const maxDd = drawdownPoints.length
    ? Math.min(...drawdownPoints.map((d) => d.drawdown))
    : 0;

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthTrades = trades.filter(
    (t) => t.pnl !== null && t.opened_at.slice(0, 7) === monthKey,
  );
  const dailyMap = new Map<string, number>();
  for (const t of monthTrades) {
    const day = t.opened_at.slice(8, 10);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + (t.pnl ?? 0));
  }
  const dailyBars = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, value]) => ({ label, value }));

  const recent = trades.filter((t) => t.pnl !== null).slice(0, 8);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted">Seguimiento</p>
          <h1 className="text-xl font-semibold">Resumen</h1>
        </div>
        <div className="flex gap-1.5 rounded-lg border border-border bg-surface p-1">
          {SCOPES.map((s) => (
            <Link
              key={s.key}
              href={`/trading?scope=${s.key}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                scope === s.key
                  ? "bg-accent text-[#06230f]"
                  : "text-muted hover:text-foreground",
              )}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Card className="p-4">
          <p className="mb-2 text-[11px] text-muted">P&amp;L neto · {stats.count} trades</p>
          <p className={cn("text-lg font-bold", stats.netPnl >= 0 ? "text-accent" : "text-danger")}>
            {money(stats.netPnl)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-[11px] text-muted">Win rate</p>
          <p className="text-lg font-bold">{stats.winRate.toFixed(1)}%</p>
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-[11px] text-muted">Profit factor</p>
          <p className={cn("text-lg font-bold", stats.profitFactor >= 1 ? "text-accent" : "text-danger")}>
            {Number.isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : "—"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-[11px] text-muted">Avg win / avg loss</p>
          <p className="text-base font-bold">
            <span className="text-accent">{money(stats.avgWin)}</span>{" "}
            <span className="text-muted">/</span>{" "}
            <span className="text-danger">{money(stats.avgLoss)}</span>
          </p>
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-[11px] text-muted">Drawdown máximo</p>
          <p className="text-lg font-bold text-danger">{money(maxDd)}</p>
        </Card>
      </div>

      {/* Score + equity curve */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <p className="mb-2 text-sm font-semibold">Puntaje de Trading</p>
          <ScoreRadar score={score} />
        </Card>
        <Card>
          <EquityCurveChart points={equityPoints} />
        </Card>
      </div>

      {/* Recent trades + daily bars + drawdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <p className="mb-3 text-sm font-semibold">Trades recientes</p>
          <TradeTable trades={recent} compact />
        </Card>
        <Card>
          <p className="mb-2 text-sm font-semibold">P&amp;L diario neto (este mes)</p>
          <DailyBarsChart bars={dailyBars} />
        </Card>
        <Card>
          <p className="mb-2 text-sm font-semibold">Drawdown</p>
          <DrawdownChart points={drawdownPoints} />
        </Card>
      </div>
    </div>
  );
}
