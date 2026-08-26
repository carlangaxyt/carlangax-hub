"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateChallengeCertificate } from "@/lib/actions/payouts";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ChallengeCertificate } from "@/lib/types";

export function CertificateEditModal({
  certificate,
  onClose,
}: {
  certificate: ChallengeCertificate;
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
        newPath = `${user.id}/certificates/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("certificates")
          .upload(newPath, file);
        if (uploadError) throw uploadError;
      }

      await updateChallengeCertificate({
        id: certificate.id,
        prop_firm: String(formData.get("prop_firm") ?? "").trim(),
        challenge_name: String(formData.get("challenge_name") ?? "").trim(),
        passed_date: String(formData.get("passed_date") ?? "") || null,
        notes: String(formData.get("notes") ?? "") || null,
        new_certificate_path: newPath,
        old_certificate_path: newPath ? certificate.certificate_path : undefined,
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
        <h2 className="mb-4 text-sm font-semibold">Editar certificado</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            name="prop_firm"
            placeholder="Prop firm"
            defaultValue={certificate.prop_firm}
            required
          />
          <Input
            name="challenge_name"
            placeholder="Challenge"
            defaultValue={certificate.challenge_name}
            required
          />
          <Input
            name="passed_date"
            type="date"
            defaultValue={certificate.passed_date?.slice(0, 10)}
          />
          <Input
            name="notes"
            placeholder="Notas"
            defaultValue={certificate.notes ?? ""}
          />
          <div>
            <label className="mb-1 block text-xs text-muted">
              Reemplazar archivo (opcional)
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
