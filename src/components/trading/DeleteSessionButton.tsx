"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteBacktestingSession } from "@/lib/actions/backtesting";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";

export function DeleteSessionButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <ConfirmDeleteButton
      label="Eliminar sesión"
      size={16}
      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:border-danger/40 hover:text-danger [&>svg]:inline"
      onConfirm={() =>
        startTransition(async () => {
          await deleteBacktestingSession(sessionId);
          router.push("/trading/backtesting");
        })
      }
    />
  );
}
