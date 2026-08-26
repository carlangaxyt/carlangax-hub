"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LineChart,
  Video,
  Bell,
  LogOut,
  ChevronRight,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  children?: { href: string; label: string }[];
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/trading",
    label: "Trading",
    icon: LineChart,
    children: [
      { href: "/trading/trades", label: "Trades" },
      { href: "/trading/payouts", label: "Payouts" },
      { href: "/trading/certificates", label: "Certificados" },
      { href: "/trading/plan", label: "Plan de Trading" },
    ],
  },
  {
    href: "/videos",
    label: "Videos",
    icon: Video,
    children: [
      { href: "/videos/library", label: "Biblioteca" },
      { href: "/videos/pipeline", label: "Pipeline" },
    ],
  },
  { href: "/reminders", label: "Recordatorios", icon: Bell },
];

export function Sidebar({
  email,
  open = true,
  onNavigate,
  onCloseMobile,
}: {
  email: string | null;
  open?: boolean;
  onNavigate?: () => void;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-surface p-4 transition-transform duration-200 ease-out",
        "md:static md:z-0 md:h-auto md:w-60 md:translate-x-0 md:bg-surface/60",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="mb-8 flex items-center justify-between px-2">
        <h1 className="text-lg font-semibold">
          Carlangax <span className="text-accent">Hub</span>
        </h1>
        <button
          onClick={onCloseMobile}
          className="text-muted hover:text-foreground md:hidden"
          aria-label="Cerrar menú"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon, children }) => {
          const groupActive = pathname.startsWith(href);
          const isOpen = children
            ? (collapsed[href] ?? groupActive)
            : false;

          return (
            <div key={href}>
              <div
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium transition-colors",
                  groupActive && !children
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:bg-surface-hover hover:text-foreground",
                )}
              >
                <Link
                  href={children ? children[0].href : href}
                  onClick={onNavigate}
                  className="flex flex-1 items-center gap-3 px-3 py-2"
                >
                  <Icon size={18} />
                  {label}
                </Link>
                {children && (
                  <button
                    onClick={() =>
                      setCollapsed((prev) => ({
                        ...prev,
                        [href]: !isOpen,
                      }))
                    }
                    className="px-2 py-2"
                    aria-label={isOpen ? "Colapsar" : "Expandir"}
                  >
                    <ChevronRight
                      size={14}
                      className={cn(
                        "transition-transform",
                        isOpen && "rotate-90",
                      )}
                    />
                  </button>
                )}
              </div>

              {children && isOpen && (
                <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-border pl-3">
                  {children.map((child) => {
                    const childActive = pathname.startsWith(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onNavigate}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-sm transition-colors",
                          childActive
                            ? "bg-accent/10 text-accent"
                            : "text-muted hover:bg-surface-hover hover:text-foreground",
                        )}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 border-t border-border pt-4">
        {email && <p className="truncate px-2 text-xs text-muted">{email}</p>}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-danger"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
