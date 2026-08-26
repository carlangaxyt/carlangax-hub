import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { CertificateForm } from "@/components/payouts/CertificateForm";
import { CertificateGrid } from "@/components/payouts/CertificateGrid";
import type { ChallengeCertificate } from "@/lib/types";

export default async function CertificatesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("challenge_certificates")
    .select("*")
    .order("sort_order", { ascending: true });

  const certificates = (data ?? []) as ChallengeCertificate[];

  const { data: signedUrls } = certificates.length
    ? await supabase.storage
        .from("certificates")
        .createSignedUrls(
          certificates.map((c) => c.certificate_path),
          60 * 60,
        )
    : { data: [] as { path: string | null; signedUrl: string }[] };

  const urlByPath = new Map(
    (signedUrls ?? []).map((u) => [u.path, u.signedUrl]),
  );
  const certificatesWithUrl = certificates.map((c) => ({
    ...c,
    url: urlByPath.get(c.certificate_path) ?? null,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Certificados</h1>
        <p className="text-sm text-muted">
          Certificados de los challenges que has pasado.
        </p>
      </div>

      <Card>
        <CertificateForm />
      </Card>

      <CertificateGrid certificates={certificatesWithUrl} />
    </div>
  );
}
