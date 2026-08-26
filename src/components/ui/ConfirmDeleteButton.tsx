"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CONFIRM_TIMEOUT = 3000;

export function ConfirmDeleteButton({
  onConfirm,
  size = 14,
  className,
  label = "Eliminar",
}: {
  onConfirm: () => void;
  size?: number;
  className?: string;
  label?: string;
}) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), CONFIRM_TIMEOUT);
    return () => clearTimeout(timer);
  }, [confirming]);

  if (confirming) {
    return (
      <button
        type="button"
        onClick={() => {
          setConfirming(false);
          onConfirm();
        }}
        onBlur={() => setConfirming(false)}
        autoFocus
        className={cn(
          "rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger",
          className,
        )}
      >
        ¿Confirmar?
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={label}
      className={cn("text-muted hover:text-danger", className)}
    >
      <Trash2 size={size} />
    </button>
  );
}
