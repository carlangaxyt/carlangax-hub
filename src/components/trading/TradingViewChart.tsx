"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

const SYMBOL_MAP: Record<string, string> = {
  NQ: "CME_MINI:NQ1!",
  MNQ: "CME_MINI:MNQ1!",
  ES: "CME_MINI:ES1!",
  MES: "CME_MINI:MES1!",
  YM: "CBOT_MINI:YM1!",
  MYM: "CBOT_MINI:MYM1!",
  RTY: "CME_MINI:RTY1!",
  M2K: "CME_MINI:M2K1!",
  GC: "COMEX:GC1!",
  CL: "NYMEX:CL1!",
  USOIL: "TVC:USOIL",
  "6E": "CME:6E1!",
  EURUSD: "FX:EURUSD",
  USDJPY: "FX:USDJPY",
  USDCAD: "FX:USDCAD",
  USDCHF: "FX:USDCHF",
  GBPUSD: "FX:GBPUSD",
  AUDUSD: "FX:AUDUSD",
  EURJPY: "FX:EURJPY",
  BTCUSDT: "BINANCE:BTCUSDT",
  DJ30: "TVC:DJI",
  NSDQ: "TVC:NDQ",
  US500: "TVC:SPX",
  USTEC: "CME_MINI:NQ1!",
};

export function toTradingViewSymbol(symbol: string) {
  return SYMBOL_MAP[symbol.toUpperCase()] ?? symbol.toUpperCase();
}

/** Gráfico avanzado de TradingView (widget gratuito oficial, embebido). */
export function TradingViewChart({ symbol }: { symbol: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === wrapperRef.current);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      wrapperRef.current?.requestFullscreen();
    }
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";
    el.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.text = JSON.stringify({
      autosize: true,
      symbol,
      interval: "60",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "es",
      withdateranges: true,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      details: false,
      hotlist: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });
    el.appendChild(script);
  }, [symbol]);

  return (
    <div
      ref={wrapperRef}
      className="relative h-[70vh] min-h-[480px] w-full [&:fullscreen]:h-screen [&:fullscreen]:bg-background [&:fullscreen]:p-2"
    >
      <button
        type="button"
        onClick={toggleFullscreen}
        className="absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-md border border-border bg-surface/90 px-2 py-1.5 text-xs text-muted backdrop-blur hover:text-foreground"
        aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
      >
        {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        {isFullscreen ? "Salir" : "Pantalla completa"}
      </button>
      <div
        ref={containerRef}
        className="tradingview-widget-container h-full w-full overflow-hidden rounded-lg"
      />
    </div>
  );
}
