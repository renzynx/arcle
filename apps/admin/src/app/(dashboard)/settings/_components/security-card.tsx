"use client";

import { Button } from "@arcle/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@arcle/ui/components/card";
import { Label } from "@arcle/ui/components/label";
import { ArrowsClockwise, ShieldCheck } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { useRegenerateSigningSecretMutation } from "@/lib/mutations";

export function SecurityCard() {
  const regenerateMutation = useRegenerateSigningSecretMutation();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRegenerate = async () => {
    try {
      await regenerateMutation.mutateAsync();
      toast.success("Signing secret regenerated successfully");
      setShowConfirm(false);
    } catch {
      toast.error("Failed to regenerate signing secret");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5" />
          Security
        </CardTitle>
        <CardDescription>
          Manage security settings for media URL signing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">URL Signing Secret</Label>
            <p className="text-xs text-muted-foreground">
              Regenerate the secret used to sign media URLs. This will
              invalidate all existing signed URLs.
            </p>
          </div>
          {showConfirm ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirm(false)}
                disabled={regenerateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRegenerate}
                disabled={regenerateMutation.isPending}
              >
                {regenerateMutation.isPending ? (
                  <>
                    <ArrowsClockwise className="mr-2 size-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  "Confirm"
                )}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirm(true)}
            >
              <ArrowsClockwise className="mr-2 size-4" />
              Regenerate Secret
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
