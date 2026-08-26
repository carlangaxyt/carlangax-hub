import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { TradingPlanEditor } from "@/components/trading/TradingPlanEditor";
import type { TradeInsight } from "@/lib/types";

export default async function TradingPlanPage() {
  const supabase = await createClient();

  const [{ data: plan }, { data: insights }] = await Promise.all([
    supabase.from("trading_plan").select("content").maybeSingle(),
    supabase
      .from("trade_insights")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Plan de Trading</h1>
        <p className="text-sm text-muted">
          Tus reglas — Claude las usa como referencia al analizar trades
          importados.
        </p>
      </div>

      <Card>
        <TradingPlanEditor initialContent={plan?.content ?? ""} />
      </Card>

      {insights && insights.length > 0 && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Últimos análisis</h2>
          <ul className="space-y-3">
            {(insights as TradeInsight[]).map((i) => (
              <li key={i.id} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                <p className="text-sm">{i.summary}</p>
                <p className="mt-1 text-xs text-muted">
                  {i.trade_count} trades · {format(new Date(i.created_at), "d MMM yyyy, HH:mm")}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
