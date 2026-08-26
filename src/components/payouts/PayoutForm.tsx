"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createPayout } from "@/lib/actions/payouts";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import type { PayoutStatus } from "@/lib/types";

export function PayoutForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="w-fit">
        + Nuevo payout
      </Button>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      const file = fileRef.current?.files?.[0];

      let proofPath: string | null = null;
      if (file) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("No autenticado");

        const ext = file.name.split(".").pop();
        const path = `${user.id}/payouts/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("certificates")
          .upload(path, file);
        if (uploadError) throw uploadError;
        proofPath = path;
      }

      await createPayout({
        prop_firm: String(formData.get("prop_firm") ?? "").trim(),
        amount: Number(formData.get("amount") ?? 0),
        currency: String(formData.get("currency") ?? "USD"),
        payout_date: String(formData.get("payout_date") ?? ""),
        status: String(formData.get("status") ?? "paid") as PayoutStatus,
        notes: String(formData.get("notes") ?? "") || null,
        proof_path: proofPath,
      });

      form.reset();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      <Input name="prop_firm" placeholder="Prop firm (ej. FTMO)" required />
      <Input name="amount" type="number" step="any" placeholder="Monto" required />
      <Input name="currency" placeholder="Moneda" defaultValue="USD" />
      <Input name="payout_date" type="date" required />
      <Select name="status" defaultValue="paid">
        <option value="paid">Pagado</option>
        <option value="pending">Pendiente</option>
      </Select>
      <Input
        name="notes"
        placeholder="Notas"
        className="col-span-2 sm:col-span-2"
      />
      <div className="col-span-2 sm:col-span-4">
        <label className="mb-1 block text-xs text-muted">
          Comprobante (opcional, imagen o PDF)
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-medium file:text-background"
        />
      </div>

      {error && <p className="col-span-2 text-sm text-danger sm:col-span-4">{error}</p>}

      <div className="col-span-2 flex gap-2 sm:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar payout"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
