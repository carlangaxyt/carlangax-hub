import type { Trade } from "@/lib/types";

export function computeEquityPoints(trades: Trade[]) {
  const closed = trades
    .filter((t) => t.pnl !== null)
    .slice()
    .sort(
      (a, b) =>
        new Date(a.closed_at ?? a.opened_at).getTime() -
        new Date(b.closed_at ?? b.opened_at).getTime(),
    );

  let cum = 0;
  return closed.map((t) => {
    cum += t.pnl ?? 0;
    return { date: t.closed_at ?? t.opened_at, cum };
  });
}
