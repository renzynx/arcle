"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@arcle/ui/components/card";
import { Label } from "@arcle/ui/components/label";
import { Skeleton } from "@arcle/ui/components/skeleton";
import { Switch } from "@arcle/ui/components/switch";
import {
  usePrivacySettings,
  useUpdatePrivacySettingsMutation,
} from "@/hooks/use-privacy-settings";

export function PrivacyTab() {
  const { data: settings, isLoading } = usePrivacySettings();
  const { mutate: updateSettings, isPending } =
    useUpdatePrivacySettingsMutation();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card>
        <CardHeader>
          <CardTitle>Tracking</CardTitle>
          <CardDescription>
            Control what data is collected about your reading activity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5 pr-4">
              <Label className="text-base">View Tracking</Label>
              <p className="text-sm text-muted-foreground">
                Allow tracking of series and chapter views. This helps improve
                recommendations and popularity rankings.
              </p>
            </div>
            <Switch
              checked={settings?.trackViews ?? true}
              disabled={isPending}
              onCheckedChange={(checked) =>
                updateSettings({ trackViews: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5 pr-4">
              <Label className="text-base">Reading History</Label>
              <p className="text-sm text-muted-foreground">
                Save your reading progress to resume where you left off. Your
                history is private and only visible to you.
              </p>
            </div>
            <Switch
              checked={settings?.trackHistory ?? true}
              disabled={isPending}
              onCheckedChange={(checked) =>
                updateSettings({ trackHistory: checked })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
