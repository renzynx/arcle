"use client";

import { Skeleton } from "@arcle/ui/components/skeleton";
import { useSettingsQuery } from "@/lib/queries";
import type { SettingsFormValues } from "./_components/constants";
import { SettingsForm } from "./_components/settings-form";
import { SettingsSkeleton } from "./_components/settings-skeleton";

export default function SettingsPage() {
  const { data: settings, isPending, isError } = useSettingsQuery();

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Configure site-wide settings and preferences.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-destructive">Failed to load settings.</p>
        </div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Settings
            </h1>
            <p className="text-muted-foreground">
              Configure site-wide settings and preferences.
            </p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <SettingsSkeleton />
      </div>
    );
  }

  return (
    <SettingsForm initialValues={settings as Partial<SettingsFormValues>} />
  );
}
