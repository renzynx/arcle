import { SeriesForm } from "@/components/series-form";

export default function NewSeriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Create Series</h3>
        <p className="text-sm text-muted-foreground">
          Add a new manga or comic series.
        </p>
      </div>
      <SeriesForm />
    </div>
  );
}
