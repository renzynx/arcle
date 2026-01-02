"use client";

import { Button } from "@arcle/ui/components/button";
import { Input } from "@arcle/ui/components/input";
import { cn } from "@arcle/ui/lib/utils";
import { Image as ImageIcon, Trash, UploadSimple } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

interface ImageUploadProps {
  value: string | File | null | undefined;
  onChange: (value: string | File | null) => void;
  maxSizeMb?: number;
  acceptedFormats?: string;
}

export function ImageUpload({
  value,
  onChange,
  maxSizeMb = 5,
  acceptedFormats = "PNG, JPG or GIF",
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    typeof value === "string" && value ? value : null,
  );
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    if (typeof value === "string" && value) {
      setPreviewUrl(value);
    } else {
      setPreviewUrl(null);
    }
  }, [value]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onChange(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center w-full min-h-[200px] border-2 border-dashed rounded-lg cursor-pointer transition-colors overflow-hidden group",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25",
        previewUrl
          ? "border-transparent bg-muted/20"
          : "hover:border-primary/50 hover:bg-muted/5",
      )}
      onClick={() => !previewUrl && fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {previewUrl ? (
        <div className="relative w-full h-full min-h-[200px] flex items-center justify-center group-hover:bg-black/5 transition-colors">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Cover preview"
            className="max-h-[300px] w-auto object-contain rounded-md"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleChange}
            >
              <UploadSimple className="w-4 h-4 mr-2" />
              Change
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
            >
              <Trash className="w-4 h-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground">
          <ImageIcon
            className="w-10 h-10 mb-3 text-muted-foreground/50"
            weight="thin"
          />
          <p className="mb-2 text-sm">
            <span className="font-semibold text-primary">Click to upload</span>{" "}
            or drag and drop
          </p>
          <p className="text-xs text-muted-foreground/75">
            {acceptedFormats} (max. {maxSizeMb}MB)
          </p>
        </div>
      )}
    </div>
  );
}
