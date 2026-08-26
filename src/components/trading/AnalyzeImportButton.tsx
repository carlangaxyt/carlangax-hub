"use client";

import { useState } from "react";
import Image from "next/image";
import {
  estimateAnalysisCost,
  analyzeImportedTrades,
} from "@/lib/actions/trade-analysis";
import { Button } from "@/components/ui/Button";

export function AnalyzeImportButton({ tradeIds }: { tradeIds: string[] }) {
  const [estimate, setEstimate] = useState<{
    tradeCount: number;
    estimatedCost: number;
  } | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadEstimate() {
    setLoadingEstimate(true);
    setError(null);
    try {
      const res = await estimateAnalysisCost(tradeIds);
      if (!res.available) {
        setUnavailable(true);
      } else {
        setEstimate({
          tradeCount: res.tradeCount,
          estimatedCost: res.estimatedCost,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al estimar costo");
    } finally {
      setLoadingEstimate(false);
    }
  }

  async function confirm() {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await analyzeImportedTrades(tradeIds);
      setSummary(res.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al analizar");
    } finally {
      setAnalyzing(false);
    }
  }

  if (summary) {
    return (
      <div className="flex gap-3 rounded-lg border border-accent/30 bg-accent/5 p-3 text-sm">
        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-accent/40">
          <Image
            src="/assistant-avatar.png"
            alt="Carlangax Ai"
            width={32}
            height={32}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <p className="mb-1 font-medium text-accent">Carlangax Ai</p>
          <p className="text-foreground">{summary}</p>
        </div>
      </div>
    );
  }

  if (unavailable) {
    return (
      <p className="text-xs text-muted">
        Falta crédito en tu cuenta de Anthropic para analizar (
        console.anthropic.com/settings/billing).
      </p>
    );
  }

  if (estimate) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border p-3">
        <p className="flex-1 text-sm text-muted">
          Analizar {estimate.tradeCount} trades — costo estimado ~$
          {estimate.estimatedCost.toFixed(4)}
        </p>
        <Button onClick={confirm} disabled={analyzing}>
          {analyzing ? "Analizando..." : "Confirmar"}
        </Button>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Button variant="secondary" onClick={loadEstimate} disabled={loadingEstimate}>
        {loadingEstimate ? "Calculando costo..." : "Analizar con IA"}
      </Button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
