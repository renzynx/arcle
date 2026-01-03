import { dehydrate, getQueryClient, HydrationBoundary } from "@arcle/query";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { MaintenancePage } from "@/components/maintenance-page";
import { Navbar } from "@/components/navbar";
import { getServerApiClient } from "@/lib/api";

type StatusResponse = {
  maintenance: boolean;
  message: string | null;
};

async function getMaintenanceStatus(): Promise<StatusResponse> {
  await connection();
  const gatewayUrl = process.env.GATEWAY_URL || "http://localhost:3000";

  try {
    const res = await fetch(`${gatewayUrl}/status`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return { maintenance: false, message: null };
    }

    return res.json();
  } catch {
    return { maintenance: false, message: null };
  }
}

export default async function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  const status = await getMaintenanceStatus();

  if (status.maintenance) {
    return <MaintenancePage message={status.message ?? undefined} />;
  }

  const queryClient = getQueryClient();
  const apiClient = await getServerApiClient();

  await queryClient.prefetchQuery({
    queryKey: ["genres"] as const,
    queryFn: () => apiClient.catalog.getGenres(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </HydrationBoundary>
  );
}
