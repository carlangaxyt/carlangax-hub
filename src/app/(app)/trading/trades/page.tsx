import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { TradeForm } from "@/components/trading/TradeForm";
import { TradeTable } from "@/components/trading/TradeTable";
import { ImportCsv } from "@/components/trading/ImportCsv";
import { TradingCharts } from "@/components/trading/TradingCharts";
import type { Trade } from "@/lib/types";

export default async function TradesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trades")
    .select("*")
    .order("opened_at", { ascending: false });

  const trades = (data ?? []) as Trade[];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Trades</h1>
        <p className="text-sm text-muted">Tu bitácora de trades.</p>
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
