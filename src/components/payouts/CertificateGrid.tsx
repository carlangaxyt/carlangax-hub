"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Award, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import {
  deleteChallengeCertificate,
  moveChallengeCertificate,
} from "@/lib/actions/payouts";
import { Card } from "@/components/ui/Card";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { CertificateEditModal } from "@/components/payouts/CertificateEditModal";
import type { ChallengeCertificate } from "@/lib/types";

type CertificateWithUrl = ChallengeCertificate & { url: string | null };

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif)$/i;
const PDF_EXT = /\.pdf$/i;

export function CertificateGrid({
  certificates,
}: {
  certificates: CertificateWithUrl[];
}) {
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<ChallengeCertificate | null>(null);

  if (certificates.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        No has subido certificados todavía.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {certificates.map((c, i) => {
          const isImage = IMAGE_EXT.test(c.certificate_path);
          const isPdf = PDF_EXT.test(c.certificate_path);

          return (
            <Card key={c.id} className="flex flex-col gap-2">
              <a
                href={c.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-background/60 text-muted hover:text-gold"
              >
                {isImage && c.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.url}
                    alt={`${c.prop_firm} ${c.challenge_name}`}
                    className="h-full w-full object-cover"
                  />
                ) : isPdf && c.url ? (
                  <iframe
                    src={`${c.url}#toolbar=0&navpanes=0&view=FitH`}
                    title={`${c.prop_firm} ${c.challenge_name}`}
                    className="pointer-events-none h-full w-full"
                  />
                ) : (
                  <Award size={28} />
                )}
              </a>

              <div className="flex-1">
                <p className="truncate text-sm font-medium">{c.prop_firm}</p>
                <p className="text-xs text-muted">
                  {c.challenge_name} ·{" "}
                  {format(new Date(c.passed_date), "d MMM yyyy")}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      startTransition(() =>
                        moveChallengeCertificate(c.id, "up"),
                      )
                    }
                    disabled={i === 0}
                    className="text-muted hover:text-foreground disabled:opacity-30"
                    aria-label="Mover arriba"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    onClick={() =>
                      startTransition(() =>
                        moveChallengeCertificate(c.id, "down"),
                      )
                    }
                    disabled={i === certificates.length - 1}
                    className="text-muted hover:text-foreground disabled:opacity-30"
                    aria-label="Mover abajo"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(c)}
                    className="text-muted hover:text-accent"
                  >
                    <Pencil size={14} />
                  </button>
                  <ConfirmDeleteButton
                    label="Eliminar certificado"
                    onConfirm={() =>
                      startTransition(() =>
                        deleteChallengeCertificate(c.id, c.certificate_path),
                      )
                    }
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {editing && (
        <CertificateEditModal
          certificate={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
