"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Pencil, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  renameOptionValue,
  deleteOptionValue,
} from "@/lib/actions/content-pipeline";

const COLORS = [
  "bg-pink-400/15 text-pink-300",
  "bg-sky-400/15 text-sky-300",
  "bg-emerald-400/15 text-emerald-300",
  "bg-amber-400/15 text-amber-300",
  "bg-purple-400/15 text-purple-300",
  "bg-orange-400/15 text-orange-300",
  "bg-red-400/15 text-red-300",
  "bg-teal-400/15 text-teal-300",
];

function colorFor(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function TagPicker({
  name,
  field,
  options,
  defaultValue,
  multi = false,
}: {
  name: string;
  field: "platform" | "series" | "content_type";
  options: string[];
  defaultValue: string | null;
  multi?: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(
    defaultValue
      ? defaultValue
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
  );
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [renames, setRenames] = useState<Record<string, string>>({});
  const [deleted, setDeleted] = useState<Set<string>>(new Set());
  const [editingOpt, setEditingOpt] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const allOptions = Array.from(
    new Set(
      [...options, ...selected]
        .filter((o) => !deleted.has(o))
        .map((o) => renames[o] ?? o),
    ),
  ).filter(Boolean);
  const filtered = allOptions.filter((o) =>
    o.toLowerCase().includes(query.toLowerCase()),
  );
  const exactMatch = allOptions.some(
    (o) => o.toLowerCase() === query.trim().toLowerCase(),
  );

  function toggle(opt: string) {
    if (multi) {
      setSelected((prev) =>
        prev.includes(opt) ? prev.filter((v) => v !== opt) : [...prev, opt],
      );
    } else {
      setSelected((prev) => (prev[0] === opt ? [] : [opt]));
      setOpen(false);
    }
  }

  function addNew() {
    const v = query.trim();
    if (!v) return;
    if (multi) {
      setSelected((prev) => [...prev, v]);
    } else {
      setSelected([v]);
      setOpen(false);
    }
    setQuery("");
  }

  function remove(opt: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSelected((prev) => prev.filter((v) => v !== opt));
  }

  function startEdit(opt: string, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingOpt(opt);
    setEditValue(opt);
  }

  async function confirmEdit(opt: string, e?: React.SyntheticEvent) {
    e?.stopPropagation();
    const next = editValue.trim();
    setEditingOpt(null);
    if (!next || next === opt) return;

    setRenames((prev) => ({ ...prev, [opt]: next }));
    setSelected((prev) => prev.map((v) => (v === opt ? next : v)));
    await renameOptionValue(field, opt, next);
    router.refresh();
  }

  async function removeOption(opt: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(`Eliminar "${opt}" de todas las tarjetas?`)) return;

    setDeleted((prev) => new Set(prev).add(opt));
    setSelected((prev) => prev.filter((v) => v !== opt));
    await deleteOptionValue(field, opt);
    router.refresh();
  }

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selected.join(", ")} />
      <div
        onClick={() => setOpen(true)}
        className="flex min-h-[32px] flex-wrap items-center gap-1 rounded-md py-1 hover:bg-surface-hover"
      >
        {selected.map((s) => (
          <span
            key={s}
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
              colorFor(s),
            )}
          >
            {s}
            <button
              type="button"
              onClick={(e) => remove(s, e)}
              className="hover:opacity-70"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          className="text-muted hover:text-foreground"
        >
          <Plus size={14} />
        </button>
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-lg border border-border bg-background p-2 shadow-xl">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addNew();
                }
              }}
              placeholder="Buscar o crear..."
              className="mb-2 w-full rounded-md border border-border bg-surface px-2 py-1 text-xs focus:outline-none"
            />
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {filtered.map((opt) =>
                editingOpt === opt ? (
                  <div
                    key={opt}
                    className="flex items-center gap-1 rounded-md px-2 py-1"
                  >
                    <input
                      autoFocus
                      value={editValue}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmEdit(opt, e);
                        if (e.key === "Escape") {
                          e.stopPropagation();
                          setEditingOpt(null);
                        }
                      }}
                      className="w-full rounded-md border border-border bg-surface px-2 py-0.5 text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={(e) => confirmEdit(opt, e)}
                      className="shrink-0 text-accent hover:opacity-70"
                    >
                      <Check size={13} />
                    </button>
                  </div>
                ) : (
                  <div
                    key={opt}
                    onClick={() => toggle(opt)}
                    className={cn(
                      "group flex w-full items-center justify-between rounded-md px-2 py-1 text-left hover:bg-surface-hover cursor-pointer",
                      selected.includes(opt) && "bg-accent/10",
                    )}
                  >
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        colorFor(opt),
                      )}
                    >
                      {opt}
                    </span>
                    <span className="hidden shrink-0 items-center gap-1.5 group-hover:flex">
                      <button
                        type="button"
                        onClick={(e) => startEdit(opt, e)}
                        className="text-muted hover:text-foreground"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => removeOption(opt, e)}
                        className="text-muted hover:text-danger"
                      >
                        <Trash2 size={12} />
                      </button>
                    </span>
                  </div>
                ),
              )}
              {query.trim() && !exactMatch && (
                <button
                  type="button"
                  onClick={addNew}
                  className="w-full rounded-md px-2 py-1 text-left text-xs text-accent hover:bg-surface-hover"
                >
                  + Crear &quot;{query.trim()}&quot;
                </button>
              )}
              {filtered.length === 0 && !query.trim() && (
                <p className="px-2 py-1 text-xs text-muted">Sin opciones aún</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
