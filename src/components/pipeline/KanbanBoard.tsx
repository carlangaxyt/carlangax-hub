"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import {
  createContentIdea,
  moveContentIdea,
} from "@/lib/actions/content-pipeline";
import { cn } from "@/lib/utils";
import { IdeaEditModal } from "@/components/pipeline/IdeaEditModal";
import type { ContentIdea, ContentStage } from "@/lib/types";

const COLUMNS: {
  id: ContentStage;
  label: string;
  emoji: string;
  dot: string;
  badge: string;
}[] = [
  { id: "idea", label: "Idea", emoji: "💡", dot: "bg-zinc-400", badge: "bg-zinc-400/10 text-zinc-300" },
  { id: "guion", label: "Guión", emoji: "📝", dot: "bg-amber-400", badge: "bg-amber-400/10 text-amber-300" },
  { id: "grabar", label: "Grabar", emoji: "🎬", dot: "bg-orange-400", badge: "bg-orange-400/10 text-orange-300" },
  { id: "editar", label: "Editar", emoji: "✂️", dot: "bg-sky-400", badge: "bg-sky-400/10 text-sky-300" },
  { id: "listo", label: "Listo", emoji: "🎯", dot: "bg-red-400", badge: "bg-red-400/10 text-red-300" },
  { id: "publicado", label: "Publicado", emoji: "✅", dot: "bg-emerald-400", badge: "bg-emerald-400/10 text-emerald-300" },
];

export function KanbanBoard({ ideas }: { ideas: ContentIdea[] }) {
  const router = useRouter();
  const [addingTo, setAddingTo] = useState<ContentStage | null>(null);
  const [editing, setEditing] = useState<ContentIdea | null>(null);
  const [dragOverStage, setDragOverStage] = useState<ContentStage | null>(
    null,
  );
  const [pendingMoves, setPendingMoves] = useState<
    Record<string, ContentStage>
  >({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const VISIBLE_LIMIT = 10;

  const displayIdeas = ideas.map((i) =>
    pendingMoves[i.id] ? { ...i, stage: pendingMoves[i.id] } : i,
  );

  function handleDrop(stage: ContentStage) {
    return (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverStage(null);
      const id = e.dataTransfer.getData("text/plain");
      const idea = displayIdeas.find((i) => i.id === id);
      if (!idea || idea.stage === stage) return;

      setPendingMoves((prev) => ({ ...prev, [id]: stage }));
      moveContentIdea(id, stage).then(() => router.refresh());
    };
  }

  async function handleAdd(stage: ContentStage, formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    if (!title) return;
    const platform = String(formData.get("platform") ?? "") || null;
    setAddingTo(null);
    await createContentIdea({ title, stage, platform });
    router.refresh();
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {COLUMNS.map((col) => {
          const allCards = displayIdeas
            .filter((i) => i.stage === col.id)
            .sort((a, b) => a.sort_order - b.sort_order);
          const isExpanded = expanded[col.id] ?? false;
          const cards =
            isExpanded || allCards.length <= VISIBLE_LIMIT
              ? allCards
              : allCards.slice(0, VISIBLE_LIMIT);
          const hiddenCount = allCards.length - cards.length;

          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStage(col.id);
              }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={handleDrop(col.id)}
              className={cn(
                "flex min-h-[200px] flex-col gap-2 rounded-xl border border-border bg-surface/40 p-3 transition-colors",
                dragOverStage === col.id && "border-accent/60 bg-accent/5",
              )}
            >
              <div className="mb-1 flex items-center gap-2 px-1">
                <span className={cn("h-2 w-2 rounded-full", col.dot)} />
                <h3 className="text-sm font-semibold">
                  {col.emoji} {col.label}
                </h3>
                <span className="ml-auto text-xs text-muted">
                  {allCards.length}
                </span>
              </div>

              <div className="max-h-[520px] space-y-2 overflow-y-auto">
                {cards.map((idea) => (
                  <div
                    key={idea.id}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/plain", idea.id)
                    }
                    onClick={() => setEditing(idea)}
                    className="cursor-grab rounded-lg border border-border bg-surface p-2.5 text-sm active:cursor-grabbing"
                  >
                    <p className="font-medium">{idea.title}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {idea.platform && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium",
                            col.badge,
                          )}
                        >
                          {idea.platform}
                        </span>
                      )}
                      {idea.scheduled_date && (
                        <span className="text-[10px] text-muted">
                          {idea.scheduled_date}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {allCards.length > VISIBLE_LIMIT && (
                <button
                  onClick={() =>
                    setExpanded((prev) => ({ ...prev, [col.id]: !isExpanded }))
                  }
                  className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-surface-hover hover:text-foreground"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={14} /> Ver menos
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} /> Ver {hiddenCount} más
                    </>
                  )}
                </button>
              )}

              {addingTo === col.id ? (
                <form
                  action={(fd) => handleAdd(col.id, fd)}
                  className="space-y-1.5 rounded-lg border border-border p-2"
                >
                  <input
                    name="title"
                    autoFocus
                    placeholder="Título..."
                    className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm focus:outline-none"
                  />
                  <input
                    name="platform"
                    placeholder="Plataforma (opcional)"
                    className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none"
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="submit"
                      className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-background"
                    >
                      Agregar
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingTo(null)}
                      className="rounded-md px-2 py-1 text-xs text-muted hover:text-foreground"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setAddingTo(col.id)}
                  className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-surface-hover hover:text-foreground"
                >
                  <Plus size={14} /> New page
                </button>
              )}
            </div>
          );
        })}
      </div>

      {editing && (
        <IdeaEditModal
          idea={editing}
          allIdeas={ideas}
          onClose={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
