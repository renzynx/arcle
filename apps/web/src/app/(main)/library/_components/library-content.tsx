"use client";

import { useSessionQuery } from "@arcle/auth-client";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@arcle/ui/components/tabs";
import { Books, ClockCounterClockwise } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { HistoryTab } from "./history-tab";
import { LibrarySkeleton } from "./library-skeleton";
import { LibraryTab } from "./library-tab";

export function LibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSessionQuery();

  const currentTab = searchParams.get("tab") || "library";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`/library?${params.toString()}`);
  };

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in");
    }
  }, [isPending, session, router]);

  if (isPending) {
    return <LibrarySkeleton />;
  }

  if (!session?.user) {
    return null;
  }

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="library">
          <Books className="h-4 w-4" />
          Library
        </TabsTrigger>
        <TabsTrigger value="history">
          <ClockCounterClockwise className="h-4 w-4" />
          History
        </TabsTrigger>
      </TabsList>

      <TabsContent value="library" className="mt-6">
        <LibraryTab />
      </TabsContent>

      <TabsContent value="history" className="mt-6">
        <HistoryTab />
      </TabsContent>
    </Tabs>
  );
}
