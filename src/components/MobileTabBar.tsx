"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LineChart, Video, Bell, Inbox } from "lucide-react";
import { getUnreadCount } from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";

const POLL_MS = 60_000;

const TABS = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  {
    href: "/trading/trades",
    match: "/trading",
    label: "Trading",
    icon: LineChart,
  },
  { href: "/videos", label: "Videos", icon: Video },
  { href: "/reminders", label: "Tareas", icon: Bell },
  { href: "/notifications", label: "Avisos", icon: Inbox, badge: true },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const count = await getUnreadCount();
        if (!cancelled) setUnread(count);
      } catch {
        // silencioso: la barra no debe romper la navegación
      }
    }
    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map(({ href, match, label, icon: Icon, badge }) => {
        const active = pathname.startsWith(match ?? href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
              active ? "text-accent" : "text-muted",
            )}
          >
            <span className="relative">
              <Icon size={20} />
              {badge && unread > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-danger px-0.5 text-[9px] font-semibold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
