"use client";

import { useRef, useTransition } from "react";
import { createReminder } from "@/lib/actions/reminders";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

export function ReminderForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          await createReminder(formData);
          formRef.current?.reset();
        })
      }
      className="flex flex-wrap items-end gap-3"
    >
      <div className="flex-1 min-w-[180px]">
        <label className="mb-1 block text-xs text-muted">Título</label>
        <Input name="title" placeholder="Revisar journal semanal" required />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Fecha</label>
        <Input name="due_at" type="datetime-local" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Prioridad</label>
        <Select name="priority" defaultValue="normal">
          <option value="low">Baja</option>
          <option value="normal">Normal</option>
          <option value="high">Alta</option>
        </Select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Agregando..." : "Agregar"}
      </Button>
    </form>
  );
}
