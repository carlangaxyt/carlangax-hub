"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Trash2, Plus, ChevronUp, ChevronDown, Check } from "lucide-react";
import {
  updateContentIdea,
  deleteContentIdea,
  createContentProperty,
  renameContentProperty,
  deleteContentProperty,
  moveContentProperty,
} from "@/lib/actions/content-pipeline";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { TagPicker } from "@/components/pipeline/TagPicker";
import type { ContentIdea, ContentProperty, PropertyType } from "@/lib/types";

const TYPE_LABELS: Record<PropertyType, string> = {
  text: "Texto",
  url: "Link",
  date: "Fecha",
  select: "Selector",
  multi_select: "Selector múltiple",
};

function valueToString(v: string | string[] | undefined): string {
  if (!v) return "";
  return Array.isArray(v) ? v.join(", ") : v;
}

function distinctValues(ideas: ContentIdea[], propertyId: string): string[] {
  const set = new Set<string>();
  for (const idea of ideas) {
    const raw = idea.properties[propertyId];
    if (!raw) continue;
    if (Array.isArray(raw)) raw.forEach((v) => v && set.add(v));
    else set.add(raw);
  }
  return Array.from(set).sort();
}

function PropertyLabel({
  property,
  isFirst,
  isLast,
}: {
  property: ContentProperty;
  isFirst: boolean;
  isLast: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(property.name);

  async function confirm() {
    const trimmed = value.trim();
    setEditing(false);
    if (!trimmed || trimmed === property.name) return;
    await renameContentProperty(property.id, trimmed);
    router.refresh();
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setValue(e.target.value)}
        onBlur={confirm}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            confirm();
          }
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-full rounded-md border border-border bg-surface px-1.5 py-0.5 text-xs focus:outline-none"
      />
    );
  }

  return (
    <div className="group flex items-center gap-1 text-xs text-muted">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="hover:text-foreground"
      >
        {property.name}
      </button>
      <span className="hidden shrink-0 items-center gap-1 group-hover:flex">
        <button
          type="button"
          disabled={isFirst || pending}
          onClick={() =>
            startTransition(async () => {
              await moveContentProperty(property.id, "up");
              router.refresh();
            })
          }
          className="text-muted hover:text-foreground disabled:opacity-30"
        >
          <ChevronUp size={11} />
        </button>
        <button
          type="button"
          disabled={isLast || pending}
          onClick={() =>
            startTransition(async () => {
              await moveContentProperty(property.id, "down");
              router.refresh();
            })
          }
          className="text-muted hover:text-foreground disabled:opacity-30"
        >
          <ChevronDown size={11} />
        </button>
        <ConfirmDeleteButton
          size={11}
          onConfirm={() =>
            startTransition(async () => {
              await deleteContentProperty(property.id);
              router.refresh();
            })
          }
        />
      </span>
    </div>
  );
}

function AddPropertyRow() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<PropertyType>("text");

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    await createContentProperty(trimmed, type);
    setName("");
    setType("text");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="flex items-center gap-1 py-2 text-xs text-muted hover:text-foreground"
      >
        <Plus size={13} /> Agregar propiedad
      </button>
    );
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex flex-wrap items-center gap-1.5 py-2"
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Nombre"
        className="w-28 rounded-md border border-border bg-surface px-2 py-1 text-xs focus:outline-none"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as PropertyType)}
        className="rounded-md border border-border bg-surface px-1.5 py-1 text-xs focus:outline-none"
      >
        {Object.entries(TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={submit}
        className="text-accent hover:opacity-70"
      >
        <Check size={14} />
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-muted hover:text-foreground"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function IdeaEditModal({
  idea,
  allIdeas,
  properties,
  onClose,
}: {
  idea: ContentIdea;
  allIdeas: ContentIdea[];
  properties: ContentProperty[];
  onClose: () => void;
}) {
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);

    const propValues: Record<string, string | string[]> = {};
    for (const prop of properties) {
      const raw = String(formData.get(`prop_${prop.id}`) ?? "").trim();
      if (!raw) continue;
      if (prop.type === "multi_select") {
        propValues[prop.id] = raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        propValues[prop.id] = raw;
      }
    }

    await updateContentIdea({
      id: idea.id,
      title: String(formData.get("title") ?? "").trim(),
      notes: String(formData.get("notes") ?? "") || null,
      properties: propValues,
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
            {properties.map((prop, i) => (
              <div
                key={prop.id}
                className="grid grid-cols-[110px_1fr] items-center gap-3 py-1.5"
              >
                <PropertyLabel
                  property={prop}
                  isFirst={i === 0}
                  isLast={i === properties.length - 1}
                />
                {prop.type === "select" || prop.type === "multi_select" ? (
                  <TagPicker
                    name={`prop_${prop.id}`}
                    propertyId={prop.id}
                    options={distinctValues(allIdeas, prop.id)}
                    defaultValue={valueToString(idea.properties[prop.id]) || null}
                    multi={prop.type === "multi_select"}
                  />
                ) : (
                  <Input
                    name={`prop_${prop.id}`}
                    type={prop.type === "date" ? "date" : "text"}
                    defaultValue={valueToString(idea.properties[prop.id])}
                    className="border-none bg-transparent px-0 focus:ring-0"
                  />
                )}
              </div>
            ))}
            <AddPropertyRow />
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
