import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { DivergingBars, DailyBarsChart } from "@/components/trading/DashboardCharts";
import {
  groupBySymbol,
  groupByWeekday,
  groupByHour,
  groupByAccount,
  winLossStreaks,
} from "@/lib/trading-metrics";
import type { Trade } from "@/lib/types";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trades")
    .select("*")
    .order("opened_at", { ascending: false });

  const trades = (data ?? []) as Trade[];

  const bySymbol = groupBySymbol(trades);
  const byWeekday = groupByWeekday(trades);
  const byHour = groupByHour(trades);
  const byAccount = groupByAccount(trades);
  const { maxWinStreak, maxLossStreak } = winLossStreaks(trades);

  const bestDay = [...byWeekday].sort((a, b) => b.pnl - a.pnl)[0];
  const worstDay = [...byWeekday].sort((a, b) => a.pnl - b.pnl)[0];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted">Seguimiento</p>
        <h1 className="text-xl font-semibold">Reportes</h1>
        <p className="text-sm text-muted">Desglose sobre tus {trades.filter((t) => t.pnl !== null).length} trades.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4">
          <p className="mb-2 text-[11px] text-muted">Mejor racha de ganadoras</p>
          <p className="text-lg font-bold text-accent">{maxWinStreak}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-[11px] text-muted">Peor racha de perdedoras</p>
          <p className="text-lg font-bold text-danger">{maxLossStreak}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-[11px] text-muted">Mejor día</p>
          <p className="text-lg font-bold text-accent">{bestDay?.label ?? "—"}</p>
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-[11px] text-muted">Peor día</p>
          <p className="text-lg font-bold text-danger">{worstDay?.label ?? "—"}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <p className="mb-3 text-sm font-semibold">P&amp;L por símbolo</p>
          <DivergingBars rows={bySymbol.map((s) => ({ label: s.symbol, value: s.pnl }))} />
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <p className="mb-2 text-sm font-semibold">P&amp;L por día de la semana</p>
            <DailyBarsChart bars={byWeekday.map((d) => ({ label: d.label, value: d.pnl }))} />
          </Card>
          <Card>
            <p className="mb-2 text-sm font-semibold">P&amp;L por hora de entrada</p>
            <DailyBarsChart
              bars={byHour.map((h) => ({ label: `${String(h.hour).padStart(2, "0")}h`, value: h.pnl }))}
            />
          </Card>
        </div>
      </div>

      <Card>
        <p className="mb-3 text-sm font-semibold">P&amp;L por cuenta</p>
        <DivergingBars rows={byAccount.map((a) => ({ label: a.account, value: a.pnl }))} />
      </Card>
    </div>
  );
}
