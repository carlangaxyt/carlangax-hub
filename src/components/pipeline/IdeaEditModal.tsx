"use client";

import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import {
  updateContentIdea,
  deleteContentIdea,
} from "@/lib/actions/content-pipeline";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { TagPicker } from "@/components/pipeline/TagPicker";
import type { ContentIdea } from "@/lib/types";

function distinctValues(
  ideas: ContentIdea[],
  field: "platform" | "series" | "content_type",
  splitCommas: boolean,
) {
  const set = new Set<string>();
  for (const idea of ideas) {
    const raw = idea[field];
    if (!raw) continue;
    if (splitCommas) {
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((v) => set.add(v));
    } else {
      set.add(raw);
    }
  }
  return Array.from(set).sort();
}

function PropertyRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-center gap-3 py-1.5">
      <span className="text-xs text-muted">{label}</span>
      {children}
    </div>
  );
}

export function IdeaEditModal({
  idea,
  allIdeas,
  onClose,
}: {
  idea: ContentIdea;
  allIdeas: ContentIdea[];
  onClose: () => void;
}) {
  const [pending, setPending] = useState(false);

  const platformOptions = distinctValues(allIdeas, "platform", true);
  const seriesOptions = distinctValues(allIdeas, "series", false);
  const typeOptions = distinctValues(allIdeas, "content_type", false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);

    await updateContentIdea({
      id: idea.id,
      title: String(formData.get("title") ?? "").trim(),
      platform: String(formData.get("platform") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || null,
      series: String(formData.get("series") ?? "") || null,
      content_type: String(formData.get("content_type") ?? "") || null,
      record_location: String(formData.get("record_location") ?? "") || null,
      scheduled_date: String(formData.get("scheduled_date") ?? "") || null,
      published_date: String(formData.get("published_date") ?? "") || null,
      published_link: String(formData.get("published_link") ?? "") || null,
    });

    setPending(false);
    onClose();
  }

  async function handleDelete() {
    setPending(true);
    await deleteContentIdea(idea.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-border bg-surface"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleDelete}
              disabled={pending}
              className="gap-1.5"
            >
              <Trash2 size={14} /> Eliminar
            </Button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-6 px-8 py-6">
          <textarea
            name="title"
            defaultValue={idea.title}
            required
            rows={2}
            className="w-full resize-none border-none bg-transparent text-3xl font-semibold leading-tight text-foreground focus:outline-none"
          />

          <div className="divide-y divide-border/60 rounded-lg border border-border px-4">
            <PropertyRow label="Plataforma">
              <TagPicker
                name="platform"
                field="platform"
                options={platformOptions}
                defaultValue={idea.platform}
                multi
              />
            </PropertyRow>
            <PropertyRow label="Serie">
              <TagPicker
                name="series"
                field="series"
                options={seriesOptions}
                defaultValue={idea.series}
              />
            </PropertyRow>
            <PropertyRow label="Tipo">
              <TagPicker
                name="content_type"
                field="content_type"
                options={typeOptions}
                defaultValue={idea.content_type}
              />
            </PropertyRow>
            <PropertyRow label="Dónde graba">
              <Input
                name="record_location"
                placeholder="Dónde se graba"
                defaultValue={idea.record_location ?? ""}
                className="border-none bg-transparent px-0 focus:ring-0"
              />
            </PropertyRow>
            <PropertyRow label="Fecha objetivo">
              <Input
                name="scheduled_date"
                type="date"
                defaultValue={idea.scheduled_date ?? ""}
                className="border-none bg-transparent px-0 focus:ring-0"
              />
            </PropertyRow>
            <PropertyRow label="Publicado el">
              <Input
                name="published_date"
                type="date"
                defaultValue={idea.published_date ?? ""}
                className="border-none bg-transparent px-0 focus:ring-0"
              />
            </PropertyRow>
            <PropertyRow label="Link">
              <Input
                name="published_link"
                placeholder="Link publicado"
                defaultValue={idea.published_link ?? ""}
                className="border-none bg-transparent px-0 focus:ring-0"
              />
            </PropertyRow>
          </div>

          <div>
            <p className="mb-2 text-xs text-muted">
              Guión / notas / descripción
            </p>
            <Textarea
              name="notes"
              rows={18}
              placeholder="Escribe el guión, beats, notas de grabación..."
              defaultValue={idea.notes ?? ""}
              className="min-h-[400px] text-sm leading-relaxed"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
