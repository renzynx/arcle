import { Suspense } from "react";
import { BrowseContent } from "./_components/browse-content";
import { BrowseSkeleton } from "./_components/browse-skeleton";

export const metadata = {
  title: "Browse",
  description: "Browse and search manga series",
};

export default function BrowsePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Browse</h1>
        <p className="text-muted-foreground">
          Discover manga series with advanced search and filters
        </p>
      </div>
      <Suspense fallback={<BrowseSkeleton />}>
        <BrowseContent />
      </Suspense>
    </div>
  );
}
