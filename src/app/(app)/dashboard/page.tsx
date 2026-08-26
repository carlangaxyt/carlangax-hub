import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { DashboardGreeting } from "@/components/DashboardGreeting";
import {
  EquityCurveChart,
  computeEquityPoints,
} from "@/components/trading/TradingCharts";
import type { Reminder, Trade, Video } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: trades }, { data: videos }, { data: reminders }] =
    await Promise.all([
      supabase
        .from("trades")
        .select("*")
        .order("opened_at", { ascending: false })
        .limit(200),
      supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("reminders")
        .select("*")
        .eq("done", false)
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(5),
    ]);

  const allTrades = (trades ?? []) as Trade[];
  const recentVideos = (videos ?? []) as Video[];
  const pendingReminders = (reminders ?? []) as Reminder[];

  const closedTrades = allTrades.filter((t) => t.pnl !== null);
  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const wins = closedTrades.filter((t) => (t.pnl ?? 0) > 0).length;
  const winRate = closedTrades.length
    ? Math.round((wins / closedTrades.length) * 100)
    : 0;
  const equityPoints = computeEquityPoints(allTrades);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <DashboardGreeting />
        <p className="mt-1 text-sm text-muted">Resumen general.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-muted">Trades registrados</p>
          <p className="mt-1 text-2xl font-semibold">{allTrades.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted">Win rate</p>
          <p className="mt-1 text-2xl font-semibold text-accent">
            {winRate}%
          </p>
        </Card>
        <Card>
          <p className="text-xs text-muted">P&L total</p>
          <p
            className={`mt-1 text-2xl font-semibold ${totalPnl >= 0 ? "text-accent" : "text-danger"}`}
          >
            {totalPnl.toFixed(2)}
          </p>
        </Card>
      </div>

      {equityPoints.length > 0 && (
        <Card>
          <EquityCurveChart points={equityPoints} />
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recordatorios pendientes</h2>
            <Link href="/reminders" className="text-xs text-accent">
              Ver todos
            </Link>
          </div>
          {pendingReminders.length === 0 ? (
            <p className="text-sm text-muted">Nada pendiente. 🎉</p>
          ) : (
            <ul className="space-y-2">
              {pendingReminders.map((r) => (
                <li key={r.id} className="text-sm">
                  <span className="font-medium">{r.title}</span>
                  {r.due_at && (
                    <span className="ml-2 text-xs text-muted">
                      {format(new Date(r.due_at), "d MMM, HH:mm")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Videos recientes</h2>
            <Link href="/videos" className="text-xs text-accent">
              Ver todos
            </Link>
          </div>
          {recentVideos.length === 0 ? (
            <p className="text-sm text-muted">Aún no subes videos.</p>
          ) : (
            <ul className="space-y-2">
              {recentVideos.map((v) => (
                <li key={v.id} className="text-sm">
                  <span className="font-medium">{v.title}</span>
                  <span className="ml-2 text-xs text-muted">
                    {format(new Date(v.created_at), "d MMM")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
