"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createChallengeCertificate } from "@/lib/actions/payouts";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function CertificateForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="w-fit">
        + Nuevo certificado
      </Button>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Selecciona el archivo del certificado");
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const ext = file.name.split(".").pop();
      const path = `${user.id}/certificates/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("certificates")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const passedDate = String(formData.get("passed_date") ?? "");

      await createChallengeCertificate({
        prop_firm: String(formData.get("prop_firm") ?? "").trim(),
        challenge_name: String(formData.get("challenge_name") ?? "").trim(),
        passed_date: passedDate || null,
        certificate_path: path,
        notes: String(formData.get("notes") ?? "") || null,
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
      <Input
        name="challenge_name"
        placeholder="Challenge (ej. Phase 1, Funded)"
        required
      />
      <Input name="passed_date" type="date" />
      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          required
          className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-medium file:text-background"
        />
      </div>
      <Input
        name="notes"
        placeholder="Notas"
        className="col-span-2 sm:col-span-4"
      />

      {error && (
        <p className="col-span-2 text-sm text-danger sm:col-span-4">{error}</p>
      )}

      <div className="col-span-2 flex gap-2 sm:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar certificado"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
