"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { deleteReminder, toggleReminder } from "@/lib/actions/reminders";
import { cn } from "@/lib/utils";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import type { Reminder } from "@/lib/types";

const PRIORITY_COLOR: Record<Reminder["priority"], string> = {
  low: "text-muted",
  normal: "text-foreground",
  high: "text-gold",
};

export function ReminderList({ reminders }: { reminders: Reminder[] }) {
  const [, startTransition] = useTransition();

  if (reminders.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        No tienes recordatorios todavía.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {reminders.map((reminder) => (
        <li
          key={reminder.id}
          className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
        >
          <input
            type="checkbox"
            checked={reminder.done}
            onChange={(e) =>
              startTransition(() =>
                toggleReminder(reminder.id, e.target.checked),
              )
            }
            className="h-4 w-4 accent-accent"
          />
          <div className="flex-1">
            <p
              className={cn(
                "text-sm font-medium",
                reminder.done && "text-muted line-through",
              )}
            >
              {reminder.title}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted">
              {reminder.due_at && (
                <span>{format(new Date(reminder.due_at), "d MMM, HH:mm")}</span>
              )}
              <span className={PRIORITY_COLOR[reminder.priority]}>
                {reminder.priority}
              </span>
            </div>
          </div>
          <ConfirmDeleteButton
            size={16}
            label="Eliminar recordatorio"
            onConfirm={() =>
              startTransition(() => deleteReminder(reminder.id))
            }
          />
        </li>
      ))}
    </ul>
  );
}
