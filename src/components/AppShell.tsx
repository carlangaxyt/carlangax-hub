"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { NotificationBell } from "@/components/NotificationBell";

export function AppShell({
  email,
  children,
}: {
  email: string | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-1 flex-col md:flex-row">
      <div className="flex items-center justify-between border-b border-border bg-surface/60 p-4 md:hidden">
        <h1 className="text-lg font-semibold">
          Carlangax <span className="text-accent">Hub</span>
        </h1>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <button
            onClick={() => setOpen(true)}
            className="text-muted hover:text-foreground"
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <Sidebar
        email={email}
        open={open}
        onNavigate={() => setOpen(false)}
        onCloseMobile={() => setOpen(false)}
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
    </div>
  );
}
