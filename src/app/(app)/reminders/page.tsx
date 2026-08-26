import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { ReminderForm } from "@/components/reminders/ReminderForm";
import { ReminderList } from "@/components/reminders/ReminderList";
import type { Reminder } from "@/lib/types";

export default async function RemindersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reminders")
    .select("*")
    .order("done", { ascending: true })
    .order("due_at", { ascending: true, nullsFirst: false });

  const reminders = (data ?? []) as Reminder[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Recordatorios</h1>
        <p className="text-sm text-muted">
          Todo lo que no quieres olvidar sobre tu trading y tu rutina.
        </p>
      </div>

      <Card>
        <ReminderForm />
      </Card>

      <Card>
        <ReminderList reminders={reminders} />
      </Card>
    </div>
  );
}
