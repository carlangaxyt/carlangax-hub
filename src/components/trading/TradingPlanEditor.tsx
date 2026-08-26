"use client";

import { useRef, useState } from "react";
import { FileUp } from "lucide-react";
import { saveTradingPlan, transcribePdfToRules } from "@/lib/actions/trading-plan";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function TradingPlanEditor({ initialContent }: { initialContent: string }) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await saveTradingPlan(content);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setTranscribing(true);
    setError(null);
    try {
      const base64 = await fileToBase64(file);
      const rules = await transcribePdfToRules(base64);
      setContent((prev) => (prev ? `${prev}\n\n${rules}` : rules));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al transcribir el PDF",
      );
    } finally {
      setTranscribing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <Textarea
        rows={16}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escribe tus reglas: setups que operas, gestión de riesgo, sesiones, criterios de entrada y salida..."
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : saved ? "Guardado ✓" : "Guardar plan"}
        </Button>

        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface-hover hover:text-foreground">
          <FileUp size={14} />
          {transcribing ? "Transcribiendo..." : "Subir PDF"}
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            onChange={handlePdfUpload}
            disabled={transcribing}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}
