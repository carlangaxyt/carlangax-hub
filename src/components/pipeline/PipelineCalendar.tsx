"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { IdeaEditModal } from "@/components/pipeline/IdeaEditModal";
import type { ContentIdea } from "@/lib/types";

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function PipelineCalendar({ ideas }: { ideas: ContentIdea[] }) {
  const router = useRouter();
  const [month, setMonth] = useState(new Date());
  const [editing, setEditing] = useState<ContentIdea | null>(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const scheduled = ideas.filter((i) => i.scheduled_date);

  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {format(month, "MMMM yyyy")}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setMonth((m) => subMonths(m, 1))}
            className="rounded-md p-1 text-muted hover:bg-surface-hover hover:text-foreground"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setMonth(new Date())}
            className="rounded-md px-2 py-1 text-xs text-muted hover:bg-surface-hover hover:text-foreground"
          >
            Hoy
          </button>
          <button
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="rounded-md p-1 text-muted hover:bg-surface-hover hover:text-foreground"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayIdeas = scheduled.filter((i) =>
            isSameDay(new Date(`${i.scheduled_date}T00:00:00`), day),
          );
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[70px] rounded-lg border border-border/60 p-1 text-left",
                !isSameMonth(day, month) && "opacity-30",
                isSameDay(day, new Date()) && "border-accent/60",
              )}
            >
              <p className="mb-1 text-[10px] text-muted">{format(day, "d")}</p>
              <div className="space-y-1">
                {dayIdeas.slice(0, 2).map((idea) => (
                  <button
                    key={idea.id}
                    onClick={() => setEditing(idea)}
                    className="block w-full truncate rounded bg-accent/10 px-1 py-0.5 text-left text-[10px] text-accent hover:bg-accent/20"
                  >
                    {idea.title}
                  </button>
                ))}
                {dayIdeas.length > 2 && (
                  <p className="text-[10px] text-muted">
                    +{dayIdeas.length - 2} más
                  </p>
                )}
              </div>
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
    </div>
  );
}
