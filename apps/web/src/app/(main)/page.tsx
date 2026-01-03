import { dehydrate, getQueryClient, HydrationBoundary } from "@arcle/query";
import { getServerApiClient } from "@/lib/api";
import { FeaturedCarousel } from "./_components/featured-carousel";
import {
  LatestSeriesSection,
  PopularSeriesSection,
} from "./_components/home-sections";

export default async function HomePage() {
  const queryClient = getQueryClient();
  const apiClient = getServerApiClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["series", "popular", 6] as const,
      queryFn: () => apiClient.catalog.getSeries({ limit: 6, sort: "popular" }),
    }),
    queryClient.prefetchQuery({
      queryKey: ["series", "latest", 12] as const,
      queryFn: () => apiClient.catalog.getSeries({ limit: 12, sort: "latest" }),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex flex-col gap-10">
        <FeaturedCarousel />
        <PopularSeriesSection />
        <LatestSeriesSection />
      </div>
    </HydrationBoundary>
  );
}
