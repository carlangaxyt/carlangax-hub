"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCheck, ExternalLink } from "lucide-react";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/types";

export function NotificationHistoryList({
  notifications,
}: {
  notifications: Notification[];
}) {
  const [items, setItems] = useState(notifications);
  const [, startTransition] = useTransition();

  const unreadCount = items.filter((n) => !n.read).length;

  function handleClick(n: Notification) {
    if (!n.read) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
      );
      startTransition(() => markNotificationRead(n.id));
    }
    if (n.link) window.open(n.link, "_blank");
  }

  function handleMarkAll() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    startTransition(() => markAllNotificationsRead());
  }

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        Sin notificaciones todavía.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleMarkAll}
            className="flex items-center gap-1 text-xs text-muted hover:text-accent"
          >
            <CheckCheck size={13} /> Marcar todas como leídas
          </button>
        </div>
      )}
      <ul className="divide-y divide-border">
        {items.map((n) => (
          <li key={n.id}>
            <button
              onClick={() => handleClick(n)}
              className={cn(
                "flex w-full items-start justify-between gap-3 py-3 text-left first:pt-0 last:pb-0",
                !n.read && "bg-accent/5",
              )}
            >
              <div className="min-w-0 flex-1 px-2">
                <p
                  className={cn(
                    "text-sm font-medium",
                    n.type === "buffer_post_error"
                      ? "text-danger"
                      : "text-foreground",
                  )}
                >
                  {n.title}
                </p>
                {n.body && (
                  <p className="mt-0.5 text-sm text-muted">{n.body}</p>
                )}
                <p className="mt-1 text-xs text-muted">
                  {format(new Date(n.created_at), "d MMM yyyy, HH:mm", {
                    locale: es,
                  })}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 pr-1">
                {!n.read && (
                  <span className="h-2 w-2 rounded-full bg-accent" />
                )}
                {n.link && <ExternalLink size={14} className="text-muted" />}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
