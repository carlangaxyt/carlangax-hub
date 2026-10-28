"use client";

import { cn } from "@/lib/utils";
import { money } from "@/lib/trading-metrics";
import type { TradingScore } from "@/lib/trading-metrics";

/** Radar de 6 ejes para el puntaje compuesto de trading. */
export function ScoreRadar({ score }: { score: TradingScore }) {
  const cx = 150;
  const cy = 150;
  const R = 110;
  const axes: { label: string; value: number }[] = [
    { label: "Win %", value: score.winRate },
    { label: "Profit factor", value: score.profitFactor },
    { label: "Avg W/L", value: score.avgWinLoss },
    { label: "Recovery", value: score.recovery },
    { label: "Drawdown", value: score.drawdown },
    { label: "Consistencia", value: score.consistency },
  ];
  const angle = (i: number) => (-90 + i * 60) * (Math.PI / 180);
  const pt = (i: number, r: number) => [
    cx + r * Math.sin(angle(i)),
    cy - r * Math.cos(angle(i)),
  ];
  const ring = (pct: number) =>
    axes.map((_, i) => pt(i, (R * pct) / 100).join(",")).join(" ");
  const dataPoly = axes.map((a, i) => pt(i, (R * a.value) / 100).join(",")).join(" ");

  return (
    <div>
      <svg viewBox="0 0 300 300" className="h-auto w-full" role="img" aria-label="Puntaje de trading">
        {[25, 50, 75, 100].map((p) => (
          <polygon
            key={p}
            points={ring(p)}
            fill="none"
            stroke="var(--border)"
            strokeWidth={1}
          />
        ))}
        <polygon
          points={dataPoly}
          fill="var(--accent)"
          fillOpacity={0.22}
          stroke="var(--accent)"
          strokeWidth={2}
        />
        {axes.map((a, i) => {
          const [x, y] = pt(i, R + 26);
          return (
            <text
              key={a.label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted text-[10px]"
            >
              {a.label}
            </text>
          );
        })}
      </svg>
      <div className="mt-1 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted">Tu puntaje</p>
          <p className="text-2xl font-bold">{score.overall}</p>
        </div>
        <div
          className="relative ml-4 h-1.5 flex-1 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, var(--danger), var(--gold), var(--accent))",
          }}
        >
          <div
            className="absolute -top-0.5 h-2.5 w-0.5 bg-foreground"
            style={{ left: `${Math.min(100, Math.max(0, score.overall))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

const W = 1000;
const H = 170;

/** Área de drawdown (siempre <= 0, en rojo). */
export function DrawdownChart({
  points,
}: {
  points: { date: string; drawdown: number }[];
}) {
  if (points.length === 0) {
    return <p className="text-sm text-muted">Sin datos suficientes.</p>;
  }
  const min = Math.min(0, ...points.map((p) => p.drawdown));
  const x = (i: number) =>
    points.length > 1 ? (i / (points.length - 1)) * W : W / 2;
  const y = (v: number) => (min === 0 ? 0 : (v / min) * H);

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.drawdown).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)},${H} L0,${H} Z`;
  const current = points[points.length - 1].drawdown;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[190px] w-full" preserveAspectRatio="none">
        <line x1={0} y1={0} x2={W} y2={0} stroke="var(--border)" strokeDasharray="3 3" />
        <path d={area} fill="var(--danger)" opacity={0.1} />
        <path d={line} fill="none" stroke="var(--danger)" strokeWidth={2} />
      </svg>
      <p className="text-xs text-muted">
        Drawdown actual: <span className="font-semibold text-danger">{money(current)}</span>
      </p>
    </div>
  );
}

/** Barras de P&L por día (verde/rojo), para el mes actual. */
export function DailyBarsChart({
  bars,
}: {
  bars: { label: string; value: number }[];
}) {
  if (bars.length === 0) {
    return <p className="text-sm text-muted">Sin trades este mes.</p>;
  }
  const innerW = 320;
  const innerH = 110;
  const values = bars.map((b) => b.value);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const y = (v: number) =>
    max === min ? innerH / 2 : innerH - ((v - min) / (max - min)) * innerH;
  const zeroY = y(0);
  const slot = innerW / bars.length;
  const barW = Math.min(22, slot * 0.6);

  return (
    <svg viewBox={`0 0 ${innerW} ${innerH + 30}`} className="h-[190px] w-full">
      <line x1={0} y1={zeroY} x2={innerW} y2={zeroY} stroke="var(--border)" />
      {bars.map((b, i) => {
        const cx = slot * i + slot / 2;
        const top = Math.min(zeroY, y(b.value));
        const height = Math.max(1, Math.abs(zeroY - y(b.value)));
        return (
          <g key={b.label + i}>
            <rect
              x={cx - barW / 2}
              y={top}
              width={barW}
              height={height}
              rx={3}
              fill={b.value >= 0 ? "var(--accent)" : "var(--danger)"}
            />
            <text x={cx} y={innerH + 16} textAnchor="middle" className="fill-muted text-[9px]">
              {b.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Barras horizontales divergentes (ej. P&L por símbolo o por cuenta). */
export function DivergingBars({
  rows,
}: {
  rows: { label: string; value: number }[];
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">Sin datos.</p>;
  }
  const maxAbs = Math.max(1, ...rows.map((r) => Math.abs(r.value)));

  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => {
        const pct = (Math.abs(r.value) / maxAbs) * 50;
        const positive = r.value >= 0;
        return (
          <div key={r.label} className="flex items-center gap-2 text-xs">
            <div className="w-20 truncate text-muted">{r.label}</div>
            <div className="relative h-4 flex-1 overflow-hidden rounded bg-border">
              <div
                className={cn(
                  "absolute top-0 h-full",
                  positive ? "left-1/2 bg-accent" : "right-1/2 bg-danger",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div
              className={cn(
                "w-16 text-right font-semibold",
                positive ? "text-accent" : "text-danger",
              )}
            >
              {money(r.value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
