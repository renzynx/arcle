import { Suspense } from "react";
import { LibraryContent } from "./_components/library-content";
import { LibrarySkeleton } from "./_components/library-skeleton";

export const metadata = {
  title: "Library",
  description: "Your reading library and history",
};

export default function LibraryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Library</h1>
        <p className="text-muted-foreground">
          Manage your reading list and track your progress
        </p>
      </div>
      <Suspense fallback={<LibrarySkeleton />}>
        <LibraryContent />
      </Suspense>
    </div>
  );
}
