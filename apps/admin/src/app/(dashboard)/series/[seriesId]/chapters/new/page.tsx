"use client";

import { use } from "react";
import { ChapterForm } from "@/components/chapter-form";

export default function NewChapterPage({
  params,
}: {
  params: Promise<{ seriesId: string }>;
}) {
  const { seriesId } = use(params);
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Create Chapter</h3>
        <p className="text-sm text-muted-foreground">
          Add a new chapter to this series.
        </p>
      </div>
      <ChapterForm seriesId={seriesId} />
    </div>
  );
}
