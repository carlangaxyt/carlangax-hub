"use client";

import { useState } from "react";
import { saveBlueprint } from "@/lib/actions/content-pipeline";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";

export function BlueprintEditor({
  initialContent,
}: {
  initialContent: string;
}) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-left text-sm text-muted hover:text-foreground"
      >
        📌 <span className="underline decoration-dotted">Ver / editar Blueprint</span>
      </button>
    );
  }

  async function handleSave() {
    setSaving(true);
    await saveBlueprint(content);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="space-y-2">
      <Textarea
        rows={8}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Tus reglas y principios: cuándo grabar, regla de oro, cómo se lee el color, etc."
      />
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : saved ? "Guardado ✓" : "Guardar"}
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)}>
          Cerrar
        </Button>
      </div>
    </div>
  );
}
