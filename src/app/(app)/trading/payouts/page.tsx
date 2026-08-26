import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { PayoutForm } from "@/components/payouts/PayoutForm";
import { PayoutList } from "@/components/payouts/PayoutList";
import type { Payout } from "@/lib/types";

export default async function PayoutsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payouts")
    .select("*")
    .order("sort_order", { ascending: true });

  const payouts = (data ?? []) as Payout[];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Payouts</h1>
        <p className="text-sm text-muted">Tus pagos de prop firms.</p>
      </div>

      <Card>
        <PayoutForm />
      </Card>

      <Card>
        <PayoutList payouts={payouts} />
      </Card>
    </div>
  );
}
