"use client";

import { SETTING_METADATA, type SettingKey } from "@arcle/api-client";
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
import { Image, Trash } from "@phosphor-icons/react";
import type { AnyFieldApi } from "@tanstack/react-form";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useUploadOgImageMutation } from "@/lib/mutations";
import { SETTINGS_BY_GROUP } from "./constants";

interface SeoCardProps {
  renderField: (
    key: SettingKey,
    render: (field: AnyFieldApi) => ReactNode,
  ) => ReactNode;
  ogImageValue: string;
  onOgImageChange: (url: string) => void;
}

export function SeoCard({
  renderField,
  ogImageValue,
  onOgImageChange,
}: SeoCardProps) {
  const uploadMutation = useUploadOgImageMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      const result = await uploadMutation.mutateAsync(file);
      onOgImageChange(result.url);
      toast.success("OG image uploaded successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload OG image",
      );
      setPreviewUrl(null);
    } finally {
      URL.revokeObjectURL(objectUrl);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    onOgImageChange("");
    setPreviewUrl(null);
  };

  const displayUrl = previewUrl || ogImageValue;
  const seoKeys = SETTINGS_BY_GROUP.seo.filter((k) => k !== "seo_og_image");

  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO</CardTitle>
        <CardDescription>
          Search engine optimization and social sharing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4 py-3 border-b">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Default OG Image</Label>
            <p className="text-xs text-muted-foreground">
              Default image for social media sharing (1200x630 recommended)
            </p>
          </div>

          {displayUrl ? (
            <div className="relative w-full max-w-md">
              <img
                src={displayUrl}
                alt="OG Preview"
                className="w-full rounded-lg border object-cover aspect-[1200/630]"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemoveImage}
              >
                <Trash className="size-4" />
              </Button>
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  fileInputRef.current?.click();
                }
              }}
              className="flex flex-col items-center justify-center w-full max-w-md h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Image className="size-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Click to upload OG image
              </p>
              <p className="text-xs text-muted-foreground">
                Recommended: 1200x630px
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {uploadMutation.isPending && (
            <p className="text-sm text-muted-foreground">Uploading...</p>
          )}
        </div>

        {seoKeys.map((key) => {
          const meta = SETTING_METADATA[key];
          return renderField(key, (field) => (
            <div
              key={key}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b last:border-0"
            >
              <div className="space-y-0.5">
                <Label htmlFor={key} className="text-sm font-medium">
                  {meta.label}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {meta.description}
                </p>
              </div>
              <Input
                id={key}
                type="text"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="w-full sm:w-64"
              />
            </div>
          ));
        })}
      </CardContent>
    </Card>
  );
}
