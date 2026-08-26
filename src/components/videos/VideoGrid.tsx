"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Play, Trash2, X } from "lucide-react";
import { deleteVideo, getVideoUrl } from "@/lib/actions/videos";
import { Card } from "@/components/ui/Card";
import type { Video } from "@/lib/types";

const CATEGORY_LABEL: Record<Video["category"], string> = {
  "trade-review": "Revisión de trade",
  psychology: "Psicología",
  "market-analysis": "Análisis de mercado",
  other: "Otro",
};

export function VideoGrid({ videos }: { videos: Video[] }) {
  const [playing, setPlaying] = useState<{ id: string; url: string } | null>(
    null,
  );
  const [, startTransition] = useTransition();

  if (videos.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        No has subido videos todavía.
      </p>
    );
  }

  async function handlePlay(video: Video) {
    const url = await getVideoUrl(video.storage_path);
    setPlaying({ id: video.id, url });
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <Card key={video.id} className="flex flex-col gap-2">
            <button
              onClick={() => handlePlay(video)}
              className="flex aspect-video items-center justify-center rounded-lg bg-background/60 text-muted hover:text-accent"
            >
              <Play size={28} />
            </button>
            <div className="flex-1">
              <p className="truncate text-sm font-medium">{video.title}</p>
              <p className="text-xs text-muted">
                {CATEGORY_LABEL[video.category]} ·{" "}
                {format(new Date(video.created_at), "d MMM yyyy")}
              </p>
              {video.tags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {video.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() =>
                startTransition(() =>
                  deleteVideo(video.id, video.storage_path),
                )
              }
              className="self-end text-muted hover:text-danger"
            >
              <Trash2 size={14} />
            </button>
          </Card>
        ))}
      </div>

      {playing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setPlaying(null)}
        >
          <div
            className="relative w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPlaying(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white"
            >
              <X size={22} />
            </button>
            <video
              src={playing.url}
              controls
              autoPlay
              className="w-full rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
}
