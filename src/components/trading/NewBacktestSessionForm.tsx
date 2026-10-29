"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBacktestingSession } from "@/lib/actions/backtesting";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function NewBacktestSessionForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="w-fit">
        + Nueva sesión de backtesting
      </Button>
    );
  }

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          const id = await createBacktestingSession(formData);
          formRef.current?.reset();
          setOpen(false);
          router.push(`/trading/backtesting/${id}`);
        })
      }
      className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-4"
    >
      <Input name="name" placeholder="Nombre (ej. NQ scalp 2025)" required className="col-span-2" />
      <Input name="symbol" placeholder="Símbolo (ej. NQ)" required />
      <Input name="start_balance" type="number" step="any" placeholder="Balance inicial (100000)" />
      <Input name="start_date" type="date" />
      <Input name="end_date" type="date" />

      <div className="col-span-2 flex gap-2 sm:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Creando..." : "Crear sesión"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
