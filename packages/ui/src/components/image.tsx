"use client";

import { cn } from "@arcle/ui/lib/utils";
import { useEffect, useRef, useState } from "react";

import { Skeleton } from "./skeleton";

type ImageLoadingStatus = "idle" | "loading" | "loaded" | "error";

type ImageProps = React.ComponentProps<"img"> & {
  fallback?: React.ReactNode;
  containerClassName?: string;
};

function Image({
  className,
  containerClassName,
  alt,
  src,
  onLoad,
  onError,
  fallback,
  ...props
}: ImageProps) {
  const [status, setStatus] = useState<ImageLoadingStatus>("idle");
  const imgRef = useRef<HTMLImageElement>(null);

  // Handle cached images - onLoad doesn't fire for browser-cached images
  useEffect(() => {
    if (!src) {
      setStatus("idle");
      return;
    }

    setStatus("loading");

    const img = imgRef.current;
    if (!img) return;

    // Check if image is already cached/complete
    if (img.complete) {
      if (img.naturalHeight !== 0) {
        setStatus("loaded");
      } else {
        setStatus("error");
      }
    }
  }, [src]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setStatus("loaded");
    onLoad?.(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setStatus("error");
    onError?.(e);
  };

  const isLoading = status === "loading" || status === "idle";
  const hasError = status === "error";

  if (hasError) {
    return (
      <div className={cn("relative", containerClassName)}>
        {fallback ?? (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center bg-muted text-muted-foreground text-xs",
              className,
            )}
          >
            Failed to load
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden",
        containerClassName,
      )}
    >
      {isLoading && <Skeleton className="absolute inset-0" />}
      <img
        ref={imgRef}
        alt={alt}
        src={src}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export { Image };
