import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { BacktestingView } from "@/components/trading/BacktestingView";
import { AddBacktestTradeForm } from "@/components/trading/AddBacktestTradeForm";
import { BacktestTradesTable } from "@/components/trading/BacktestTradesTable";
import { DeleteSessionButton } from "@/components/trading/DeleteSessionButton";
import { computeStats, money } from "@/lib/trading-metrics";
import { cn } from "@/lib/utils";
import type { BacktestingSession, Trade } from "@/lib/types";

export default async function BacktestingSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("backtesting_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!session) notFound();

  const { data: tradesData } = await supabase
    .from("trades")
    .select("*")
    .eq("backtesting_session_id", id)
    .order("opened_at", { ascending: false });

  const trades = (tradesData ?? []) as Trade[];
  const stats = computeStats(trades);
  const s = session as BacktestingSession;

  const hasLoggedTrades = trades.length > 0;
  const currentBalance = hasLoggedTrades
    ? (s.start_balance ?? 100000) + stats.netPnl
    : (s.current_balance ?? s.start_balance ?? 100000);
  const netProfit = hasLoggedTrades ? stats.netPnl : (s.net_profit ?? 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/trading/backtesting" className="text-xs text-muted hover:text-foreground">
            &larr; Backtesting
          </Link>
          <h1 className="mt-1 text-xl font-semibold">{s.name}</h1>
          <p className="text-sm text-muted">
            {s.symbol} · {s.start_date ?? "—"} → {s.end_date ?? "—"}
          </p>
        </div>
        <DeleteSessionButton sessionId={s.id} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4">
          <p className="mb-2 text-[11px] text-muted">Balance actual</p>
          <p className="text-lg font-bold">{money(currentBalance)}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-[11px] text-muted">Net profit</p>
          <p className={cn("text-lg font-bold", netProfit >= 0 ? "text-accent" : "text-danger")}>
            {money(netProfit)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-[11px] text-muted">Trades</p>
          <p className="text-lg font-bold">{hasLoggedTrades ? stats.count : s.trade_count}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-[11px] text-muted">Win rate</p>
          <p className="text-lg font-bold">
            {hasLoggedTrades ? `${stats.winRate.toFixed(1)}%` : "—"}
          </p>
        </Card>
      </div>

      {!hasLoggedTrades && s.trade_count > 0 && (
        <p className="text-xs text-muted">
          Esta sesión viene con un resumen ya calculado en TradeZella ({s.trade_count} trades,{" "}
          {s.completion !== null ? `${s.completion.toFixed(1)}% completada` : ""}). Si agregas trades
          nuevos aquí, las métricas de arriba pasan a calcularse con ellos.
        </p>
      )}

      <BacktestingView symbols={[s.symbol]} />

      <Card>
        <p className="mb-3 text-sm font-semibold">Trades simulados</p>
        <div className="mb-4">
          <AddBacktestTradeForm sessionId={s.id} defaultSymbol={s.symbol} />
        </div>
        <BacktestTradesTable trades={trades} sessionId={s.id} />
      </Card>
    </div>
  );
}
