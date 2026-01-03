"use client";

import type { SeriesWithChapters } from "@arcle/api-client";
import { useGatewayUrl } from "@arcle/auth-client";
import { Button } from "@arcle/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@arcle/ui/components/card";
import { Input } from "@arcle/ui/components/input";
import { Label } from "@arcle/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@arcle/ui/components/select";
import { Textarea } from "@arcle/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { cleanupOrphanedCover, processCoverImage } from "@/lib/cover-upload";
import {
  useCreateSeriesMutation,
  useUpdateSeriesMutation,
} from "@/lib/mutations";
import { useGenresQuery } from "@/lib/queries";
import { FieldInfo } from "./field-info";
import { ImageUpload } from "./image-upload";
import { MultiSelect } from "./multi-select";

const seriesSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  author: z.string().optional(),
  status: z.enum(["ongoing", "completed", "hiatus", "cancelled"]),
  coverImage: z.unknown().optional(),
});

function validateCoverImage(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  if (typeof value === "object" || typeof value === "string") {
    return undefined;
  }
  return undefined;
}

const STATUS_OPTIONS = [
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "hiatus", label: "Hiatus" },
  { value: "cancelled", label: "Cancelled" },
] as const;

type SeriesFormProps = {
  series?: SeriesWithChapters;
};

export function SeriesForm({ series }: SeriesFormProps) {
  const router = useRouter();
  const gatewayUrl = useGatewayUrl();
  const createMutation = useCreateSeriesMutation();
  const updateMutation = useUpdateSeriesMutation();
  const { data: genres } = useGenresQuery();

  const genreOptions = (genres ?? []).map((g) => ({
    value: g.id,
    label: g.name,
  }));

  const form = useForm({
    defaultValues: {
      title: series?.title ?? "",
      description: series?.description ?? "",
      author: series?.author ?? "",
      status:
        (series?.status as "ongoing" | "completed" | "hiatus" | "cancelled") ??
        "ongoing",
      coverImage: (series?.coverImage ?? "") as string | File | null,
      genreIds: (series?.genres?.map((g) => g.id) ?? []) as string[],
    },
    onSubmit: async ({ value }) => {
      const coverResult = await processCoverImage({
        coverImage: value.coverImage,
        gatewayUrl,
      });

      if (coverResult === null) {
        return;
      }

      const { coverImageUrl, uploadedFilename } = coverResult;

      try {
        const submissionData = {
          ...value,
          coverImage: coverImageUrl,
        };

        if (series) {
          await updateMutation.mutateAsync({
            id: series.id,
            ...submissionData,
          });
          toast.success("Series updated successfully");
        } else {
          await createMutation.mutateAsync({
            ...submissionData,
            title: value.title,
          });
          toast.success("Series created successfully");
        }
        router.push("/series");
      } catch (error) {
        if (uploadedFilename) {
          await cleanupOrphanedCover(uploadedFilename, gatewayUrl);
        }
        toast.error("Failed to save series");
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
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Series Details</CardTitle>
              <CardDescription>
                Basic information about the series.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <form.Field
                  name="title"
                  validators={{
                    onChange: ({ value }) => {
                      const res = seriesSchema.shape.title.safeParse(value);
                      if (!res.success) {
                        return res.error?.issues[0]?.message;
                      }
                      return undefined;
                    },
                  }}
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Title</Label>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g. The Beginning After The End"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                />

                <form.Field
                  name="author"
                  validators={{
                    onChange: ({ value }) => {
                      const res = seriesSchema.shape.author.safeParse(value);
                      if (!res.success) {
                        return res.error?.issues[0]?.message;
                      }
                      return undefined;
                    },
                  }}
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Author</Label>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g. TurtleMe"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                />
              </div>

              <form.Field
                name="description"
                validators={{
                  onChange: ({ value }) => {
                    const res = seriesSchema.shape.description.safeParse(value);
                    if (!res.success) {
                      return res.error?.issues[0]?.message;
                    }
                    return undefined;
                  },
                }}
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Description</Label>
                    <Textarea
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="min-h-[150px]"
                      placeholder="Enter a brief description of the series..."
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <form.Field
                name="status"
                validators={{
                  onChange: ({ value }) => {
                    const res = seriesSchema.shape.status.safeParse(value);
                    if (!res.success) {
                      return res.error?.issues[0]?.message;
                    }
                    return undefined;
                  },
                }}
                children={(field) => (
                  <div className="space-y-2">
                    <Select
                      value={field.state.value}
                      onValueChange={(val) =>
                        field.handleChange(
                          val as
                            | "ongoing"
                            | "completed"
                            | "hiatus"
                            | "cancelled",
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {STATUS_OPTIONS.find(
                            (opt) => opt.value === field.state.value,
                          )?.label ?? "Select status"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldInfo field={field} />
                  </div>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Genres</CardTitle>
            </CardHeader>
            <CardContent>
              <form.Field
                name="genreIds"
                children={(field) => (
                  <div className="space-y-2">
                    <MultiSelect
                      options={genreOptions}
                      selected={field.state.value}
                      onChange={(val) => field.handleChange(val)}
                      placeholder="Select genres..."
                      emptyMessage="No genres found."
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cover Image</CardTitle>
            </CardHeader>
            <CardContent>
              <form.Field
                name="coverImage"
                validators={{
                  onChange: ({ value }) => validateCoverImage(value),
                }}
                children={(field) => (
                  <div className="space-y-2">
                    <ImageUpload
                      value={field.state.value as string | File | null}
                      onChange={(val) =>
                        field.handleChange(val as string | File | null)
                      }
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.state.isSubmitting}>
          {form.state.isSubmitting
            ? "Saving..."
            : series
              ? "Update Series"
              : "Create Series"}
        </Button>
      </div>
    </form>
  );
}
