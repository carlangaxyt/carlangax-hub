import Link from "next/link";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { DayDetailPanel } from "@/components/trading/DayDetailPanel";
import { groupByDay, money } from "@/lib/trading-metrics";
import { cn } from "@/lib/utils";
import type { DailyJournalEntry, Trade } from "@/lib/types";

const WEEKDAY_LABELS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; day?: string }>;
}) {
  const { month: monthParam, day: dayParam } = await searchParams;

  const today = new Date();
  const monthDate = monthParam ? new Date(`${monthParam}-01T00:00:00`) : today;
  const monthKey = format(monthDate, "yyyy-MM");

  const supabase = await createClient();
  const { data } = await supabase
    .from("trades")
    .select("*")
    .order("opened_at", { ascending: false });

  const trades = (data ?? []) as Trade[];
  const dailyMap = groupByDay(trades);

  const gridStart = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 });

  const weeks: Date[][] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor);
      cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    }
    weeks.push(week);
  }

  let monthTotal = 0;
  let monthDays = 0;
  for (const [key, g] of dailyMap) {
    if (key.startsWith(monthKey)) {
      monthTotal += g.pnl;
      monthDays += 1;
    }
  }

  const selectedDay =
    dayParam ??
    Array.from(dailyMap.keys())
      .filter((k) => k.startsWith(monthKey))
      .sort()
      .reverse()[0] ??
    format(today, "yyyy-MM-dd");

  const dayTrades = trades.filter(
    (t) => t.pnl !== null && (t.opened_at ?? "").slice(0, 10) === selectedDay,
  );

  const { data: journalData } = await supabase
    .from("daily_journal")
    .select("*")
    .eq("journal_date", selectedDay)
    .maybeSingle();
  const journal = journalData as DailyJournalEntry | null;

  const prevMonth = format(subMonths(monthDate, 1), "yyyy-MM");
  const nextMonth = format(addMonths(monthDate, 1), "yyyy-MM");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted">Seguimiento</p>
          <h1 className="text-xl font-semibold">Calendario</h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href={`/trading/calendar?month=${prevMonth}`} className="text-muted hover:text-foreground">
            &larr;
          </Link>
          <span className="font-semibold capitalize">
            {format(monthDate, "MMMM yyyy", { locale: es })}
          </span>
          <Link href={`/trading/calendar?month=${nextMonth}`} className="text-muted hover:text-foreground">
            &rarr;
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="mb-2 flex justify-end text-xs text-muted">
            Estadísticas del mes:{" "}
            <span className={cn("ml-1 font-semibold", monthTotal >= 0 ? "text-accent" : "text-danger")}>
              {money(monthTotal)}
            </span>
            <span className="ml-1">· {monthDays} días</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] text-muted">
            {WEEKDAY_LABELS.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {weeks.map((week, wi) => {
            const weekPnl = week.reduce(
              (s, d) => s + (dailyMap.get(format(d, "yyyy-MM-dd"))?.pnl ?? 0),
              0,
            );
            const weekDays = week.filter((d) =>
              dailyMap.has(format(d, "yyyy-MM-dd")),
            ).length;

            return (
              <div key={wi} className="mt-1.5 grid grid-cols-7 gap-1.5">
                {week.map((d) => {
                  const key = format(d, "yyyy-MM-dd");
                  const inMonth = format(d, "yyyy-MM") === monthKey;
                  const g = dailyMap.get(key);
                  const isSelected = key === selectedDay;

                  return (
                    <Link
                      key={key}
                      href={`/trading/calendar?month=${monthKey}&day=${key}`}
                      className={cn(
                        "flex aspect-square flex-col justify-between rounded-lg border p-1.5 text-[11px]",
                        !inMonth && "opacity-30",
                        isSelected ? "border-accent border-2" : "border-border",
                        g
                          ? g.pnl >= 0
                            ? "bg-accent/15"
                            : "bg-danger/20"
                          : "bg-surface",
                      )}
                    >
                      <span className="text-muted">{format(d, "d")}</span>
                      {g && (
                        <span
                          className={cn(
                            "text-[11px] font-bold",
                            g.pnl >= 0 ? "text-accent" : "text-danger",
                          )}
                        >
                          {money(g.pnl)}
                        </span>
                      )}
                    </Link>
                  );
                })}
                <div className="col-span-7 -mt-1.5 hidden" />
                <div className="col-span-7 flex justify-end text-[10px] text-muted">
                  {weekDays > 0 && (
                    <span>
                      Semana {wi + 1}:{" "}
                      <span className={cn("font-medium", weekPnl >= 0 ? "text-accent" : "text-danger")}>
                        {money(weekPnl)}
                      </span>{" "}
                      · {weekDays} días
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <DayDetailPanel
          date={selectedDay}
          trades={dayTrades}
          initialNote={journal?.content ?? ""}
        />
      </div>
    </div>
  );
}
