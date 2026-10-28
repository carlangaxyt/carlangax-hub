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

/** Drawdown en cada punto de la curva de equity (cum - máximo acumulado hasta ese punto). */
export function computeDrawdownPoints(trades: Trade[]) {
  const equity = computeEquityPoints(trades);
  let peak = 0;
  return equity.map((p) => {
    peak = Math.max(peak, p.cum);
    return { date: p.date, drawdown: p.cum - peak };
  });
}

export function maxDrawdown(trades: Trade[]) {
  const dd = computeDrawdownPoints(trades);
  return dd.length ? Math.min(...dd.map((d) => d.drawdown)) : 0;
}

export function currentDrawdown(trades: Trade[]) {
  const dd = computeDrawdownPoints(trades);
  return dd.length ? dd[dd.length - 1].drawdown : 0;
}

export interface TradeStats {
  count: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  netPnl: number;
  grossWin: number;
  grossLoss: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  expectancy: number;
}

export function computeStats(trades: Trade[]): TradeStats {
  const closed = trades.filter((t) => t.pnl !== null);
  const wins = closed.filter((t) => (t.result ?? (t.pnl! > 0 ? "win" : t.pnl! < 0 ? "loss" : "breakeven")) === "win");
  const losses = closed.filter((t) => (t.result ?? (t.pnl! > 0 ? "win" : t.pnl! < 0 ? "loss" : "breakeven")) === "loss");
  const breakevens = closed.length - wins.length - losses.length;

  const netPnl = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const grossWin = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const grossLoss = losses.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const avgWin = wins.length ? grossWin / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;
  const profitFactor = grossLoss !== 0 ? Math.abs(grossWin / grossLoss) : grossWin > 0 ? Infinity : 0;
  const expectancy = closed.length ? netPnl / closed.length : 0;

  return {
    count: closed.length,
    wins: wins.length,
    losses: losses.length,
    breakevens,
    winRate: closed.length ? (wins.length / closed.length) * 100 : 0,
    netPnl,
    grossWin,
    grossLoss,
    avgWin,
    avgLoss,
    profitFactor,
    expectancy,
  };
}

export function groupBySymbol(trades: Trade[]) {
  const map = new Map<string, { count: number; pnl: number; wins: number }>();
  for (const t of trades) {
    if (t.pnl === null) continue;
    const g = map.get(t.symbol) ?? { count: 0, pnl: 0, wins: 0 };
    g.count += 1;
    g.pnl += t.pnl;
    if (t.result === "win") g.wins += 1;
    map.set(t.symbol, g);
  }
  return Array.from(map.entries())
    .map(([symbol, g]) => ({ symbol, ...g, winRate: g.count ? (g.wins / g.count) * 100 : 0 }))
    .sort((a, b) => a.pnl - b.pnl);
}

export function groupBySetup(trades: Trade[]) {
  const map = new Map<string, { count: number; pnl: number; wins: number }>();
  for (const t of trades) {
    if (t.pnl === null) continue;
    const key = t.setup?.trim() || "Sin playbook";
    const g = map.get(key) ?? { count: 0, pnl: 0, wins: 0 };
    g.count += 1;
    g.pnl += t.pnl;
    if (t.result === "win") g.wins += 1;
    map.set(key, g);
  }
  return Array.from(map.entries())
    .map(([setup, g]) => ({
      setup,
      ...g,
      winRate: g.count ? (g.wins / g.count) * 100 : 0,
      expectancy: g.count ? g.pnl / g.count : 0,
    }))
    .sort((a, b) => b.pnl - a.pnl);
}

export function groupByAccount(trades: Trade[]) {
  const map = new Map<string, { count: number; pnl: number }>();
  for (const t of trades) {
    if (t.pnl === null) continue;
    const key = t.account?.trim() || "Manual";
    const g = map.get(key) ?? { count: 0, pnl: 0 };
    g.count += 1;
    g.pnl += t.pnl;
    map.set(key, g);
  }
  return Array.from(map.entries())
    .map(([account, g]) => ({ account, ...g }))
    .sort((a, b) => b.pnl - a.pnl);
}

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function groupByWeekday(trades: Trade[]) {
  const totals = Array.from({ length: 7 }, () => ({ count: 0, pnl: 0 }));
  for (const t of trades) {
    if (t.pnl === null) continue;
    const d = new Date(t.opened_at).getDay();
    totals[d].count += 1;
    totals[d].pnl += t.pnl;
  }
  // Lunes a viernes, el orden habitual de una semana de trading
  return [1, 2, 3, 4, 5].map((d) => ({ label: WEEKDAY_LABELS[d], ...totals[d] }));
}

export function groupByHour(trades: Trade[]) {
  const totals = Array.from({ length: 24 }, () => ({ count: 0, pnl: 0 }));
  for (const t of trades) {
    if (t.pnl === null) continue;
    const h = new Date(t.opened_at).getHours();
    totals[h].count += 1;
    totals[h].pnl += t.pnl;
  }
  return totals
    .map((g, hour) => ({ hour, ...g }))
    .filter((g) => g.count > 0);
}

/** P&L neto por día (YYYY-MM-DD, en la hora local del navegador/servidor). */
export function groupByDay(trades: Trade[]) {
  const map = new Map<string, { count: number; pnl: number }>();
  for (const t of trades) {
    if (t.pnl === null) continue;
    const key = (t.opened_at ?? "").slice(0, 10);
    const g = map.get(key) ?? { count: 0, pnl: 0 };
    g.count += 1;
    g.pnl += t.pnl;
    map.set(key, g);
  }
  return map;
}

export function winLossStreaks(trades: Trade[]) {
  const closed = trades
    .filter((t) => t.pnl !== null)
    .slice()
    .sort(
      (a, b) =>
        new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime(),
    );

  let curWin = 0;
  let curLoss = 0;
  let maxWin = 0;
  let maxLoss = 0;
  for (const t of closed) {
    if (t.result === "win") {
      curWin += 1;
      curLoss = 0;
      maxWin = Math.max(maxWin, curWin);
    } else if (t.result === "loss") {
      curLoss += 1;
      curWin = 0;
      maxLoss = Math.max(maxLoss, curLoss);
    } else {
      curWin = 0;
      curLoss = 0;
    }
  }
  return { maxWinStreak: maxWin, maxLossStreak: maxLoss };
}

export interface TradingScore {
  overall: number;
  winRate: number;
  profitFactor: number;
  avgWinLoss: number;
  recovery: number;
  drawdown: number;
  consistency: number;
}

/**
 * Puntaje compuesto 0-100 derivado de las métricas reales del trader, en el mismo
 * espíritu que el "Zella Score" de TradeZella (promedio de 6 factores normalizados).
 * No es el cálculo propietario de TradeZella, es nuestra propia fórmula.
 */
export function tradingScore(trades: Trade[]): TradingScore {
  const stats = computeStats(trades);
  const maxDd = Math.abs(maxDrawdown(trades));

  const winRate = Math.min(100, stats.winRate);
  const profitFactor = Math.min(100, (stats.profitFactor / 2) * 100);
  const avgWinLoss =
    stats.avgLoss !== 0
      ? Math.min(100, (Math.abs(stats.avgWin / stats.avgLoss) / 3) * 100)
      : stats.avgWin > 0
        ? 100
        : 0;
  const recoveryFactor = maxDd !== 0 ? Math.abs(stats.netPnl) / maxDd : 0;
  const recovery = Math.min(100, recoveryFactor * 100);
  const drawdown = maxDd !== 0 ? Math.max(0, 100 - (maxDd / 2000) * 100) : 100;

  const byWeekday = groupByWeekday(trades).filter((d) => d.count > 0);
  const positiveDays = byWeekday.filter((d) => d.pnl > 0).length;
  const consistency = byWeekday.length
    ? (positiveDays / byWeekday.length) * 100
    : 0;

  const overall =
    (winRate + profitFactor + avgWinLoss + recovery + drawdown + consistency) /
    6;

  return {
    overall: Math.round(overall),
    winRate: Math.round(winRate),
    profitFactor: Math.round(profitFactor),
    avgWinLoss: Math.round(avgWinLoss),
    recovery: Math.round(recovery),
    drawdown: Math.round(drawdown),
    consistency: Math.round(consistency),
  };
}

export function money(v: number) {
  const sign = v > 0 ? "+" : v < 0 ? "-" : "";
  return `${sign}$${Math.abs(v).toFixed(2)}`;
}
