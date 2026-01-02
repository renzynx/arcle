"use client";

import { Button } from "@arcle/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@arcle/ui/components/card";
import { Skeleton } from "@arcle/ui/components/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@arcle/ui/components/tabs";
import {
  Files,
  FileText,
  HardDrives,
  Image as ImageIcon,
  Images,
  Trash,
} from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

import { useClearTempMutation, useDeleteCoverMutation } from "@/lib/mutations";
import {
  useMediaCoversQuery,
  useMediaPagesQuery,
  useMediaStatsQuery,
} from "@/lib/queries";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function MediaStatsCards() {
  const { data: stats, isPending } = useMediaStatsQuery();
  const { mutate: clearTemp, isPending: isClearing } = useClearTempMutation();

  if (isPending) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
          <HardDrives className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatBytes(stats?.totalSize ?? 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            Across all media types
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Covers</CardTitle>
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.covers.fileCount ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatBytes(stats?.covers.totalSize ?? 0)} total usage
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pages</CardTitle>
          <Images className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.pages.fileCount ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatBytes(stats?.pages.totalSize ?? 0)} total usage
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Chapters</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.chapters.chapterCount ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats?.chapters.fileCount ?? 0} files (
            {formatBytes(stats?.chapters.totalSize ?? 0)})
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Temp Files</CardTitle>
          <Files className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.temp.fileCount ?? 0}</div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">
              {formatBytes(stats?.temp.totalSize ?? 0)}
            </p>
            {(stats?.temp.fileCount ?? 0) > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={() => clearTemp()}
                disabled={isClearing}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type MediaFile = {
  filename: string;
  size: number;
  createdAt: Date;
  url: string;
};

function ImageGrid({
  type,
  data,
  isPending,
}: {
  type: "covers" | "pages";
  data: MediaFile[];
  isPending: boolean;
}) {
  const { mutate: deleteCover } = useDeleteCoverMutation();

  if (isPending) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[2/3] w-full rounded-lg" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/10 border-dashed">
        <Images className="size-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-medium">No {type} found</h3>
        <p className="text-sm text-muted-foreground">
          Upload some content to see media files here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {data.map((file) => (
        <div key={file.filename} className="group relative space-y-2">
          <div className="relative aspect-[2/3] overflow-hidden rounded-lg border bg-muted">
            <img
              src={file.url}
              alt={file.filename}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />

            {type === "covers" && (
              <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    if (
                      confirm("Are you sure you want to delete this cover?")
                    ) {
                      deleteCover(file.filename);
                    }
                  }}
                >
                  <Trash className="size-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="truncate text-xs font-medium" title={file.filename}>
              {file.filename}
            </p>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{formatBytes(file.size)}</span>
              <span>
                {formatDistanceToNow(new Date(file.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MediaPage() {
  const [coversPage] = useState(0);
  const [pagesPage] = useState(0);

  const { data: coversData, isPending: coversPending } = useMediaCoversQuery({
    limit: 50,
    offset: coversPage * 50,
  });

  const { data: pagesData, isPending: pagesPending } = useMediaPagesQuery({
    limit: 50,
    offset: pagesPage * 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Media Management
          </h1>
          <p className="text-muted-foreground">
            Manage storage, covers, and page images.
          </p>
        </div>
      </div>

      <MediaStatsCards />

      <Tabs defaultValue="covers" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="covers">Covers</TabsTrigger>
            <TabsTrigger value="pages">Pages</TabsTrigger>
          </TabsList>
          <div className="text-xs text-muted-foreground">
            Showing latest uploads
          </div>
        </div>

        <TabsContent value="covers" className="space-y-4">
          <ImageGrid
            type="covers"
            data={coversData?.data ?? []}
            isPending={coversPending}
          />
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <ImageGrid
            type="pages"
            data={pagesData?.data ?? []}
            isPending={pagesPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
