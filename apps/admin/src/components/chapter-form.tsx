"use client";

import type { Chapter } from "@arcle/api-client";
import { Button } from "@arcle/ui/components/button";
import { Input } from "@arcle/ui/components/input";
import { Label } from "@arcle/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import {
  useCreateChapterMutation,
  useUpdateChapterMutation,
} from "@/lib/mutations";
import { FieldInfo } from "./field-info";

const chapterSchema = z.object({
  number: z.coerce.number().min(0, "Number is required"),
  title: z.string().optional(),
});

type ChapterFormProps = {
  chapter?: Chapter;
  seriesId: string;
};

export function ChapterForm({ chapter, seriesId }: ChapterFormProps) {
  const router = useRouter();
  const createMutation = useCreateChapterMutation();
  const updateMutation = useUpdateChapterMutation();

  const form = useForm({
    defaultValues: {
      number: chapter?.number ?? 0,
      title: chapter?.title ?? "",
    },
    onSubmit: async ({ value }) => {
      try {
        if (chapter) {
          await updateMutation.mutateAsync({
            id: chapter.id,
            seriesId: seriesId,
            ...value,
          });
          toast.success("Chapter updated successfully");
        } else {
          await createMutation.mutateAsync({
            seriesId: seriesId,
            ...value,
          });
          toast.success("Chapter created successfully");
        }
        router.push(`/series/${seriesId}/chapters`);
      } catch (error) {
        toast.error("Failed to save chapter");
        console.error(error);
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-8"
    >
      <form.Field
        name="number"
        validators={{
          onChange: ({ value }) => {
            const res = chapterSchema.shape.number.safeParse(value);
            if (!res.success) {
              return res.error?.issues[0]?.message;
            }
            return undefined;
          },
        }}
        children={(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Chapter Number</Label>
            <Input
              id={field.name}
              type="number"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(Number(e.target.value))}
            />
            <FieldInfo field={field} />
          </div>
        )}
      />

      <form.Field
        name="title"
        validators={{
          onChange: ({ value }) => {
            const res = chapterSchema.shape.title.safeParse(value);
            if (!res.success) {
              return res.error?.issues[0]?.message;
            }
            return undefined;
          },
        }}
        children={(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Title (Optional)</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldInfo field={field} />
          </div>
        )}
      />

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.state.isSubmitting}>
          {form.state.isSubmitting
            ? "Saving..."
            : chapter
              ? "Update Chapter"
              : "Create Chapter"}
        </Button>
      </div>
    </form>
  );
}
