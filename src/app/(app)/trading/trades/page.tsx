import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { TradeForm } from "@/components/trading/TradeForm";
import { TradeTable } from "@/components/trading/TradeTable";
import { ImportCsv } from "@/components/trading/ImportCsv";
import { TradingCharts } from "@/components/trading/TradingCharts";
import { cn } from "@/lib/utils";
import type { Trade } from "@/lib/types";

const SCOPES = [
  { key: "live", label: "Live" },
  { key: "backtest", label: "Backtesting" },
  { key: "all", label: "Todas" },
] as const;

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const { scope: scopeParam } = await searchParams;
  const scope = (["live", "backtest", "all"] as const).includes(
    scopeParam as "live" | "backtest" | "all",
  )
    ? (scopeParam as "live" | "backtest" | "all")
    : "all";

  const supabase = await createClient();
  const { data } = await supabase
    .from("trades")
    .select("*")
    .order("opened_at", { ascending: false });

  const all = (data ?? []) as Trade[];
  const trades = all.filter((t) => {
    if (scope === "all") return true;
    if (scope === "backtest") return t.account_type === "backtest";
    return t.account_type === "live" || t.account_type === null;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Trades</h1>
          <p className="text-sm text-muted">Tu bitácora de trades.</p>
        </div>
        <div className="flex gap-1.5 rounded-lg border border-border bg-surface p-1">
          {SCOPES.map((s) => (
            <Link
              key={s.key}
              href={`/trading/trades?scope=${s.key}`}
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

      <TradingCharts trades={trades} />

      <Card className="space-y-4">
        <TradeForm />
        <ImportCsv />
      </Card>

      <Card>
        <TradeTable trades={trades} />
      </Card>
    </div>
  );
}
