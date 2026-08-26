"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updatePayout } from "@/lib/actions/payouts";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import type { Payout, PayoutStatus } from "@/lib/types";

export function PayoutEditModal({
  payout,
  onClose,
}: {
  payout: Payout;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const formData = new FormData(e.currentTarget);
      const file = fileRef.current?.files?.[0];

      let newPath: string | undefined;
      if (file) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("No autenticado");

        const ext = file.name.split(".").pop();
        newPath = `${user.id}/payouts/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("certificates")
          .upload(newPath, file);
        if (uploadError) throw uploadError;
      }

      await updatePayout({
        id: payout.id,
        prop_firm: String(formData.get("prop_firm") ?? "").trim(),
        amount: Number(formData.get("amount") ?? 0),
        currency: String(formData.get("currency") ?? "USD"),
        payout_date: String(formData.get("payout_date") ?? ""),
        status: String(formData.get("status") ?? "paid") as PayoutStatus,
        notes: String(formData.get("notes") ?? "") || null,
        new_proof_path: newPath,
        old_proof_path: newPath ? payout.proof_path : undefined,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-border bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted hover:text-foreground"
        >
          <X size={18} />
        </button>
        <h2 className="mb-4 text-sm font-semibold">Editar payout</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            name="prop_firm"
            placeholder="Prop firm"
            defaultValue={payout.prop_firm}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              name="amount"
              type="number"
              step="any"
              placeholder="Monto"
              defaultValue={payout.amount}
              required
            />
            <Input
              name="currency"
              placeholder="Moneda"
              defaultValue={payout.currency}
            />
          </div>
          <Input
            name="payout_date"
            type="date"
            defaultValue={payout.payout_date?.slice(0, 10)}
            required
          />
          <Select name="status" defaultValue={payout.status}>
            <option value="paid">Pagado</option>
            <option value="pending">Pendiente</option>
          </Select>
          <Input
            name="notes"
            placeholder="Notas"
            defaultValue={payout.notes ?? ""}
          />
          <div>
            <label className="mb-1 block text-xs text-muted">
              Reemplazar comprobante (opcional)
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-medium file:text-background"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
