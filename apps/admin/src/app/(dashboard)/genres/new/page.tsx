import { GenreForm } from "@/components/genre-form";

export default function NewGenrePage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Create Genre</h3>
        <p className="text-sm text-muted-foreground">
          Add a new genre for categorizing series.
        </p>
      </div>
      <GenreForm />
    </div>
  );
}
