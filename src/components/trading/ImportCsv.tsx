"use client";

import { useState, useTransition } from "react";
import { Upload } from "lucide-react";
import {
  parseImportCsv,
  sourceHint,
  type ImportSource,
} from "@/lib/csv-import";
import { bulkImportTrades } from "@/lib/actions/trades";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { AnalyzeImportButton } from "@/components/trading/AnalyzeImportButton";

const SOURCES: { id: ImportSource; label: string }[] = [
  { id: "tradezella", label: "TradeZella" },
  { id: "topstep", label: "TopStep" },
  { id: "mt5", label: "MetaTrader 5" },
];

export function ImportCsv() {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<ImportSource>("tradezella");
  const [csvText, setCsvText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [insertedIds, setInsertedIds] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)} className="w-fit">
        Importar CSV
      </Button>
    );
  }

  function handleImport() {
    setResult(null);
    setInsertedIds([]);
    const parsed = parseImportCsv(csvText, source);
    if (parsed.length === 0) {
      setResult("No se encontraron filas válidas en el CSV.");
      return;
    }
    startTransition(async () => {
      const res = await bulkImportTrades(parsed);
      setResult(
        `Importados ${res.imported} trades nuevos (${res.skipped} ya existían o se ignoraron).`,
      );
      setInsertedIds(res.insertedIds);
      setCsvText("");
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex gap-2">
        {SOURCES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSource(s.id)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium",
              source === s.id
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border text-muted hover:text-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted">{sourceHint(source)}</p>

      <Textarea
        rows={8}
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        placeholder="Pega aquí el contenido del CSV..."
        className="font-mono text-xs"
      />

      <div className="flex gap-2">
        <Button
          onClick={handleImport}
          disabled={!csvText.trim() || pending}
          className="gap-1.5"
        >
          <Upload size={14} />
          {pending ? "Importando..." : "Importar"}
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)}>
          Cerrar
        </Button>
      </div>

      {result && <p className="text-xs text-accent">{result}</p>}

      {insertedIds.length > 0 && (
        <AnalyzeImportButton tradeIds={insertedIds} />
      )}
    </div>
  );
}
