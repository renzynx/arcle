"use client";

import type { Genre } from "@arcle/api-client";
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
import { Textarea } from "@arcle/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import {
  useCreateGenreMutation,
  useUpdateGenreMutation,
} from "@/lib/mutations";
import { FieldInfo } from "./field-info";

const genreSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
});

type GenreFormProps = {
  genre?: Genre;
};

export function GenreForm({ genre }: GenreFormProps) {
  const router = useRouter();
  const createMutation = useCreateGenreMutation();
  const updateMutation = useUpdateGenreMutation();

  const form = useForm({
    defaultValues: {
      name: genre?.name ?? "",
      description: genre?.description ?? "",
    },
    onSubmit: async ({ value }) => {
      try {
        if (genre) {
          await updateMutation.mutateAsync({
            id: genre.id,
            ...value,
          });
          toast.success("Genre updated successfully");
        } else {
          await createMutation.mutateAsync(value);
          toast.success("Genre created successfully");
        }
        router.push("/genres");
      } catch (error) {
        toast.error("Failed to save genre");
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
      <Card>
        <CardHeader>
          <CardTitle>Genre Details</CardTitle>
          <CardDescription>Basic information about the genre.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) => {
                const res = genreSchema.shape.name.safeParse(value);
                if (!res.success) {
                  return res.error?.issues[0]?.message;
                }
                return undefined;
              },
            }}
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Name</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g. Action, Romance, Fantasy"
                />
                <FieldInfo field={field} />
              </div>
            )}
          />

          <form.Field
            name="description"
            validators={{
              onChange: ({ value }) => {
                const res = genreSchema.shape.description.safeParse(value);
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
                  className="min-h-[100px]"
                  placeholder="Enter a brief description of the genre..."
                />
                <FieldInfo field={field} />
              </div>
            )}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.state.isSubmitting}>
          {form.state.isSubmitting
            ? "Saving..."
            : genre
              ? "Update Genre"
              : "Create Genre"}
        </Button>
      </div>
    </form>
  );
}
