import { Wrench } from "@phosphor-icons/react/dist/ssr";

type MaintenancePageProps = {
  message?: string;
};

export function MaintenancePage({ message }: MaintenancePageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-muted">
            <Wrench
              className="w-12 h-12 text-muted-foreground"
              weight="duotone"
            />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Under Maintenance
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          {message ||
            "We're currently performing scheduled maintenance. Please check back soon."}
        </p>
      </div>
    </div>
  );
}
