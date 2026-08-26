"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createVideoRecord } from "@/lib/actions/videos";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import type { VideoCategory } from "@/lib/types";

export function VideoUploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="w-fit">
        + Subir video
      </Button>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Selecciona un archivo de video");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      setProgress("Subiendo archivo...");
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(path, file);
      if (uploadError) throw uploadError;

      setProgress("Guardando información...");
      const tags = String(formData.get("tags") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await createVideoRecord({
        title: String(formData.get("title") ?? "").trim() || file.name,
        description: String(formData.get("description") ?? "") || null,
        category: String(formData.get("category") ?? "other") as VideoCategory,
        tags,
        storage_path: path,
      });

      form.reset();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir el video");
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        required
        className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-medium file:text-background"
      />
      <div className="grid grid-cols-2 gap-3">
        <Input name="title" placeholder="Título" />
        <Select name="category" defaultValue="other">
          <option value="trade-review">Revisión de trade</option>
          <option value="psychology">Psicología</option>
          <option value="market-analysis">Análisis de mercado</option>
          <option value="other">Otro</option>
        </Select>
      </div>
      <Input name="tags" placeholder="Tags separados por coma" />
      <Input name="description" placeholder="Descripción (opcional)" />

      {error && <p className="text-sm text-danger">{error}</p>}
      {progress && <p className="text-sm text-muted">{progress}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={uploading}>
          {uploading ? "Subiendo..." : "Subir"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setOpen(false)}
          disabled={uploading}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
