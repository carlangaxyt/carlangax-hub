"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, FileText, Pencil } from "lucide-react";
import { deletePayout, getCertificateUrl, movePayout } from "@/lib/actions/payouts";
import { cn } from "@/lib/utils";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { PayoutEditModal } from "@/components/payouts/PayoutEditModal";
import type { Payout } from "@/lib/types";

export function PayoutList({ payouts }: { payouts: Payout[] }) {
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<Payout | null>(null);

  if (payouts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        No hay payouts registrados todavía.
      </p>
    );
  }

  const total = payouts
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  async function viewProof(path: string) {
    const url = await getCertificateUrl(path);
    window.open(url, "_blank");
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Total pagado:{" "}
        <span className="font-semibold text-accent">
          ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="py-2 pr-3 font-medium"></th>
              <th className="py-2 pr-3 font-medium">Fecha</th>
              <th className="py-2 pr-3 font-medium">Prop firm</th>
              <th className="py-2 pr-3 font-medium">Monto</th>
              <th className="py-2 pr-3 font-medium">Estado</th>
              <th className="py-2 pr-3 font-medium">Comprobante</th>
              <th className="py-2 pr-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p, i) => (
              <tr key={p.id} className="border-b border-border/60">
                <td className="py-2 pr-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        startTransition(() => movePayout(p.id, "up"))
                      }
                      disabled={i === 0}
                      className="text-muted hover:text-foreground disabled:opacity-30"
                      aria-label="Mover arriba"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() =>
                        startTransition(() => movePayout(p.id, "down"))
                      }
                      disabled={i === payouts.length - 1}
                      className="text-muted hover:text-foreground disabled:opacity-30"
                      aria-label="Mover abajo"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </td>
                <td className="py-2 pr-3 text-muted">
                  {format(new Date(p.payout_date), "d MMM yyyy")}
                </td>
                <td className="py-2 pr-3 font-medium">{p.prop_firm}</td>
                <td className="py-2 pr-3 text-accent">
                  {p.currency} {p.amount.toFixed(2)}
                </td>
                <td className="py-2 pr-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs",
                      p.status === "paid"
                        ? "bg-accent/10 text-accent"
                        : "bg-gold/10 text-gold",
                    )}
                  >
                    {p.status === "paid" ? "Pagado" : "Pendiente"}
                  </span>
                </td>
                <td className="py-2 pr-3">
                  {p.proof_path ? (
                    <button
                      onClick={() => viewProof(p.proof_path!)}
                      className="flex items-center gap-1 text-muted hover:text-accent"
                    >
                      <FileText size={14} /> Ver
                    </button>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="py-2 pr-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditing(p)}
                      className="text-muted hover:text-accent"
                    >
                      <Pencil size={14} />
                    </button>
                    <ConfirmDeleteButton
                      label="Eliminar payout"
                      onConfirm={() =>
                        startTransition(() => deletePayout(p.id, p.proof_path))
                      }
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <PayoutEditModal payout={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
