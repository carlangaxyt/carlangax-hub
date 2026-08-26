import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { VideoUploadForm } from "@/components/videos/VideoUploadForm";
import { VideoGrid } from "@/components/videos/VideoGrid";
import type { Video } from "@/lib/types";

export default async function VideoLibraryPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false });

  const videos = (data ?? []) as Video[];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Biblioteca de Videos</h1>
        <p className="text-sm text-muted">
          Organiza tus grabaciones de revisión, psicología y análisis.
        </p>
      </div>

      <Card>
        <VideoUploadForm />
      </Card>

      <VideoGrid videos={videos} />
    </div>
  );
}
