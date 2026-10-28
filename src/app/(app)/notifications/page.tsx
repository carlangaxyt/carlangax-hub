import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { NotificationHistoryList } from "@/components/notifications/NotificationHistoryList";
import type { Notification } from "@/lib/types";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const notifications = (data ?? []) as Notification[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Notificaciones</h1>
        <p className="text-sm text-muted">
          Publicaciones de Buffer y otros avisos del Hub.
        </p>
      </div>

      <Card>
        <NotificationHistoryList notifications={notifications} />
      </Card>
    </div>
  );
}
