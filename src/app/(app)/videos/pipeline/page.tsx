import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { BlueprintEditor } from "@/components/pipeline/BlueprintEditor";
import { KanbanBoard } from "@/components/pipeline/KanbanBoard";
import { PipelineCalendar } from "@/components/pipeline/PipelineCalendar";
import type { ContentIdea } from "@/lib/types";

export default async function PipelinePage() {
  const supabase = await createClient();

  const [{ data: blueprint }, { data: ideas }] = await Promise.all([
    supabase.from("content_blueprint").select("content").maybeSingle(),
    supabase
      .from("content_ideas")
      .select("*")
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Pipeline de Contenido</h1>
        <p className="text-sm text-muted">
          Tus videos moviéndose por el proceso: idea → guión → grabar →
          editar → listo.
        </p>
      </div>

      <Card>
        <BlueprintEditor initialContent={blueprint?.content ?? ""} />
      </Card>

      <KanbanBoard ideas={(ideas ?? []) as ContentIdea[]} />

      <PipelineCalendar ideas={(ideas ?? []) as ContentIdea[]} />
    </div>
  );
}
