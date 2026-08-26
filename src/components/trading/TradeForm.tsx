"use client";

import { useRef, useState, useTransition } from "react";
import { createTrade } from "@/lib/actions/trades";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

export function TradeForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="w-fit">
        + Nuevo trade
      </Button>
    );
  }

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          await createTrade(formData);
          formRef.current?.reset();
          setOpen(false);
        })
      }
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      <Input name="symbol" placeholder="EURUSD" required />
      <Select name="direction" defaultValue="long">
        <option value="long">Long</option>
        <option value="short">Short</option>
      </Select>
      <Input name="session" placeholder="Sesión (London, NY...)" />
      <Input name="setup" placeholder="Setup (OB, Fib 62%...)" />
      <Input name="entry" type="number" step="any" placeholder="Entrada" />
      <Input name="exit" type="number" step="any" placeholder="Salida" />
      <Input name="size" type="number" step="any" placeholder="Tamaño" />
      <Input
        name="r_multiple"
        type="number"
        step="any"
        placeholder="R múltiplo"
      />
      <Input name="pnl" type="number" step="any" placeholder="P&L" />
      <Input
        name="notes"
        placeholder="Notas"
        className="col-span-2 sm:col-span-3"
      />

      <div className="col-span-2 flex gap-2 sm:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar trade"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setOpen(false)}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
