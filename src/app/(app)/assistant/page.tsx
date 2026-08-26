import { Card } from "@/components/ui/Card";
import { Chat } from "@/components/assistant/Chat";

export default function AssistantPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Asistente</h1>
        <p className="text-sm text-muted">
          Conoce tus trades, videos y recordatorios. Pregúntale.
        </p>
      </div>

      <Card>
        <Chat />
      </Card>
    </div>
  );
}
