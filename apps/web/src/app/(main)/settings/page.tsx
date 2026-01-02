"use client";

import { useSessionQuery } from "@arcle/auth-client";
import { Separator } from "@arcle/ui/components/separator";
import { Skeleton } from "@arcle/ui/components/skeleton";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { NotificationsTab } from "./_components/notifications-tab";
import { PreferencesTab } from "./_components/preferences-tab";
import { PrivacyTab } from "./_components/privacy-tab";
import { ProfileTab } from "./_components/profile-tab";
import { SecurityTab } from "./_components/security-tab";
import { SettingsNav, settingsTabs } from "./_components/settings-nav";

function SettingsPageSkeleton() {
  return (
    <div className="container max-w-6xl py-10 space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="flex flex-col lg:flex-row gap-8">
        <Skeleton className="h-64 w-full lg:w-64 shrink-0" />
        <div className="flex-1 space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSessionQuery();

  const tabFromUrl = searchParams.get("tab");
  const validTab = settingsTabs.find((t) => t.id === tabFromUrl);
  const [activeTab, setActiveTab] = useState(validTab?.id || "security");

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tabId);
    window.history.pushState({}, "", url);
  };

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in");
    }
  }, [isPending, session, router]);

  if (isPending) {
    return <SettingsPageSkeleton />;
  }

  if (!session?.user) {
    return null;
  }

  const activeTabInfo = settingsTabs.find((t) => t.id === activeTab);

  return (
    <div className="container max-w-6xl py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Separator />

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <SettingsNav activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="flex-1 space-y-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              {activeTabInfo?.label}
            </h2>
            <p className="text-muted-foreground">
              {activeTabInfo?.description}
            </p>
          </div>
          <Separator className="my-6" />

          {activeTab === "security" && <SecurityTab user={session.user} />}
          {activeTab === "profile" && <ProfileTab user={session.user} />}
          {activeTab === "preferences" && <PreferencesTab />}
          {activeTab === "privacy" && <PrivacyTab />}
          {activeTab === "notifications" && (
            <NotificationsTab user={session.user} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsPageSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
