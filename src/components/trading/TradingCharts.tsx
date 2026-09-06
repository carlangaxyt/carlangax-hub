"use client";

import { useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { computeEquityPoints } from "@/lib/trading-metrics";
import type { Trade } from "@/lib/types";

const W = 640;
const H = 220;
const PAD = { top: 16, right: 12, bottom: 24, left: 44 };

function money(v: number) {
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}`;
}

function niceTicks(min: number, max: number, count = 4) {
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const span = max - min;
  const step = span / (count - 1);
  return Array.from({ length: count }, (_, i) => min + step * i);
}

/** Curva de equity: P&L acumulado a lo largo del tiempo. */
export function EquityCurveChart({
  points,
}: {
  points: { date: string; cum: number }[];
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const values = points.map((p) => p.cum);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const ticks = niceTicks(min, max, 4);

  const x = (i: number) =>
    points.length > 1 ? (i / (points.length - 1)) * innerW : innerW / 2;
  const y = (v: number) =>
    max === min ? innerH / 2 : innerH - ((v - min) / (max - min)) * innerH;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.cum).toFixed(1)}`)
    .join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L${x(points.length - 1).toFixed(1)},${y(0).toFixed(1)} L${x(0).toFixed(1)},${y(0).toFixed(1)} Z`
      : "";

  function handleMove(e: React.PointerEvent<SVGRectElement>) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || points.length === 0) return;
    const px = ((e.clientX - rect.left) / rect.width) * W - PAD.left;
    const ratio = Math.min(1, Math.max(0, px / innerW));
    const idx = Math.round(ratio * (points.length - 1));
    setHover(idx);
  }

  const active = hover !== null ? points[hover] : points[points.length - 1];

  return (
    <div ref={wrapRef} className="relative">
      <p className="mb-1 text-xs text-muted">
        Curva de equity
        {active && (
          <span
            className={cn(
              "ml-2 font-medium",
              active.cum >= 0 ? "text-accent" : "text-danger",
            )}
          >
            {money(active.cum)}
          </span>
        )}
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="Curva de equity acumulada"
      >
        <defs>
          <linearGradient id="equity-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {ticks.map((t, i) => (
            <g key={i}>
              <line
                x1={0}
                x2={innerW}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text
                x={-8}
                y={y(t)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-muted text-[9px] tabular-nums"
              >
                {t.toFixed(0)}
              </text>
            </g>
          ))}

          {points.length > 0 && (
            <>
              <path d={areaPath} fill="url(#equity-fill)" stroke="none" />
              <path
                d={linePath}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <circle
                cx={x(points.length - 1)}
                cy={y(points[points.length - 1].cum)}
                r={4}
                fill="var(--accent)"
                stroke="var(--surface)"
                strokeWidth={2}
              />
              {hover !== null && (
                <>
                  <line
                    x1={x(hover)}
                    x2={x(hover)}
                    y1={0}
                    y2={innerH}
                    stroke="var(--border)"
                    strokeWidth={1}
                  />
                  <circle
                    cx={x(hover)}
                    cy={y(points[hover].cum)}
                    r={4}
                    fill="var(--accent)"
                    stroke="var(--surface)"
                    strokeWidth={2}
                  />
                </>
              )}
              <rect
                x={0}
                y={0}
                width={innerW}
                height={innerH}
                fill="transparent"
                onPointerMove={handleMove}
                onPointerLeave={() => setHover(null)}
              />
            </>
          )}
        </g>
      </svg>
      {active && (
        <p className="text-right text-[10px] text-muted">
          {format(parseISO(active.date), "d MMM yyyy", { locale: es })}
        </p>
      )}
    </div>
  );
}

/** P&L mensual: barras divergentes desde cero (verde = ganancia, rojo = pérdida). */
function MonthlyPnlChart({
  bars,
}: {
  bars: { label: string; value: number }[];
}) {
  const [hover, setHover] = useState<number | null>(null);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const values = bars.map((b) => b.value);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const ticks = niceTicks(min, max, 4);

  const y = (v: number) =>
    max === min ? innerH / 2 : innerH - ((v - min) / (max - min)) * innerH;
  const zeroY = y(0);

  const slot = bars.length > 0 ? innerW / bars.length : innerW;
  const barW = Math.min(24, slot * 0.6);

  const active = hover !== null ? bars[hover] : null;

  return (
    <div className="relative">
      <p className="mb-1 flex items-center gap-3 text-xs text-muted">
        P&L mensual
        {active ? (
          <span
            className={cn(
              "font-medium",
              active.value >= 0 ? "text-accent" : "text-danger",
            )}
          >
            {active.label}: {money(active.value)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-accent" /> Ganancia
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-danger" /> Pérdida
            </span>
          </span>
        )}
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="P&L por mes"
      >
        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={0}
              x2={innerW}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--border)"
              strokeWidth={1}
            />
          ))}
          <line
            x1={0}
            x2={innerW}
            y1={zeroY}
            y2={zeroY}
            stroke="var(--border)"
            strokeWidth={1}
          />

          {bars.map((b, i) => {
            const cx = slot * i + slot / 2;
            const top = Math.min(zeroY, y(b.value));
            const height = Math.max(1, Math.abs(zeroY - y(b.value)));
            const positive = b.value >= 0;
            const isHover = hover === i;
            return (
              <g key={b.label}>
                <rect
                  x={cx - barW / 2}
                  y={top}
                  width={barW}
                  height={height}
                  rx={4}
                  fill={positive ? "var(--accent)" : "var(--danger)"}
                  opacity={isHover ? 1 : 0.85}
                />
                <text
                  x={cx}
                  y={innerH + 14}
                  textAnchor="middle"
                  className="fill-muted text-[9px]"
                >
                  {b.label}
                </text>
                <rect
                  x={cx - slot / 2}
                  y={0}
                  width={slot}
                  height={innerH}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${b.label}: ${money(b.value)}`}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export function TradingCharts({ trades }: { trades: Trade[] }) {
  const { equityPoints, monthlyBars } = useMemo(() => {
    const equityPoints = computeEquityPoints(trades);
    const closed = trades.filter((t) => t.pnl !== null);

    const monthlyMap = new Map<string, number>();
    for (const t of closed) {
      const date = parseISO(t.closed_at ?? t.opened_at);
      const key = format(date, "yyyy-MM");
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + (t.pnl ?? 0));
    }
    const monthlyBars = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, value]) => ({
        label: format(parseISO(`${key}-01`), "MMM", { locale: es }),
        value,
      }));

    return { equityPoints, monthlyBars };
  }, [trades]);

  if (equityPoints.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <EquityCurveChart points={equityPoints} />
      </Card>
      <Card>
        <MonthlyPnlChart bars={monthlyBars} />
      </Card>
    </div>
  );
}
