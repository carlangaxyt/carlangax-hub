"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Bell, CheckCheck } from "lucide-react";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/types";

const POLL_MS = 60_000;

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await listNotifications(15);
        if (!cancelled) setNotifications(data);
      } catch {
        // silencioso: el bell no debe romper el resto de la app
      }
    }
    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleOpenNotification(n: Notification) {
    if (!n.read) {
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
      );
      startTransition(() => markNotificationRead(n.id));
    }
    if (n.link) window.open(n.link, "_blank");
  }

  function handleMarkAll() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    startTransition(() => markAllNotificationsRead());
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative text-muted hover:text-foreground"
        aria-label="Notificaciones"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-sm font-semibold">Notificaciones</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1 text-xs text-muted hover:text-accent"
              >
                <CheckCheck size={13} /> Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                Sin notificaciones todavía.
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleOpenNotification(n)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 border-b border-border/60 px-3 py-2 text-left last:border-0 hover:bg-surface-hover",
                    !n.read && "bg-accent/5",
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-medium",
                      n.type === "buffer_post_error"
                        ? "text-danger"
                        : "text-foreground",
                    )}
                  >
                    {n.title}
                  </span>
                  {n.body && (
                    <span className="line-clamp-2 text-xs text-muted">
                      {n.body}
                    </span>
                  )}
                  <span className="text-[10px] text-muted">
                    {format(new Date(n.created_at), "d MMM, HH:mm", {
                      locale: es,
                    })}
                  </span>
                </button>
              ))
            )}
          </div>

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-border px-3 py-2 text-center text-xs text-accent hover:bg-surface-hover"
          >
            Ver todas
          </Link>
        </div>
      )}
    </div>
  );
}
