"use client";

import {
  useListSessionsQuery,
  useRevokeOtherSessionsMutation,
  useRevokeSessionMutation,
} from "@arcle/auth-client";
import { Button } from "@arcle/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@arcle/ui/components/dialog";
import { Skeleton } from "@arcle/ui/components/skeleton";
import { Spinner } from "@arcle/ui/components/spinner";
import {
  Desktop,
  DeviceMobile,
  Devices,
  SignOut,
  Trash,
} from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";

export function SessionsSection() {
  const sessionsQuery = useListSessionsQuery();

  if (sessionsQuery.isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const sessions = sessionsQuery.data ?? [];

  return (
    <div className="space-y-4">
      {sessions.length === 0 ? (
        <div className="flex items-center gap-3 p-4 border rounded-lg border-dashed">
          <Devices className="size-8 text-muted-foreground" />
          <div>
            <p className="font-medium">No active sessions</p>
            <p className="text-sm text-muted-foreground">
              You&apos;re not signed in on any devices
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session, index) => (
            <SessionItem
              key={session.id ?? `session-${index}`}
              id={session.id}
              token={session.token}
              userAgent={session.userAgent}
              ipAddress={session.ipAddress}
              createdAt={session.createdAt}
              expiresAt={session.expiresAt}
              isCurrent={
                typeof window !== "undefined" &&
                document.cookie.includes(session.token.slice(0, 16))
              }
            />
          ))}
        </div>
      )}

      {sessions.length > 1 && <RevokeAllSessionsButton />}
    </div>
  );
}

function parseUserAgent(userAgent?: string | null): {
  device: string;
  browser: string;
  isMobile: boolean;
} {
  if (!userAgent) {
    return {
      device: "Unknown device",
      browser: "Unknown browser",
      isMobile: false,
    };
  }

  const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);

  let browser = "Unknown browser";
  if (userAgent.includes("Firefox")) {
    browser = "Firefox";
  } else if (userAgent.includes("Edg")) {
    browser = "Edge";
  } else if (userAgent.includes("Chrome")) {
    browser = "Chrome";
  } else if (userAgent.includes("Safari")) {
    browser = "Safari";
  }

  let device = "Unknown device";
  if (userAgent.includes("Windows")) {
    device = "Windows";
  } else if (userAgent.includes("Mac OS")) {
    device = "macOS";
  } else if (userAgent.includes("Linux")) {
    device = "Linux";
  } else if (userAgent.includes("Android")) {
    device = "Android";
  } else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
    device = "iOS";
  }

  return { device, browser, isMobile };
}

function SessionItem({
  token,
  userAgent,
  ipAddress,
  createdAt,
  expiresAt,
  isCurrent,
}: {
  id: string;
  token: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: Date;
  expiresAt: Date;
  isCurrent?: boolean;
}) {
  const revokeMutation = useRevokeSessionMutation();
  const { device, browser, isMobile } = parseUserAgent(userAgent);

  const handleRevoke = () => {
    revokeMutation.mutate(token, {
      onSuccess: () => toast.success("Session revoked"),
      onError: (error) =>
        toast.error(error.message || "Failed to revoke session"),
    });
  };

  const isExpired = new Date(expiresAt) < new Date();

  return (
    <div
      className={`flex items-center justify-between p-4 border rounded-lg ${
        isCurrent ? "border-primary bg-primary/5" : ""
      } ${isExpired ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-3">
        {isMobile ? (
          <DeviceMobile className="size-6 text-muted-foreground" />
        ) : (
          <Desktop className="size-6 text-muted-foreground" />
        )}
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">
              {browser} on {device}
            </p>
            {isCurrent && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                Current
              </span>
            )}
            {isExpired && (
              <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                Expired
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 text-xs text-muted-foreground">
            {ipAddress && <span>{ipAddress}</span>}
            <span className="hidden sm:inline">•</span>
            <span>Created {new Date(createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      {!isCurrent && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleRevoke}
          disabled={revokeMutation.isPending}
          title="Revoke session"
        >
          {revokeMutation.isPending ? (
            <Spinner className="size-4" />
          ) : (
            <SignOut className="size-4 text-destructive" />
          )}
        </Button>
      )}
    </div>
  );
}

function RevokeAllSessionsButton() {
  const [open, setOpen] = useState(false);
  const revokeAllMutation = useRevokeOtherSessionsMutation();

  const handleRevokeAll = () => {
    revokeAllMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("All other sessions have been revoked");
        setOpen(false);
      },
      onError: (error) =>
        toast.error(error.message || "Failed to revoke sessions"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" className="w-full">
            <Trash className="size-4" />
            Sign out of all other sessions
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign out of all other sessions?</DialogTitle>
          <DialogDescription>
            This will sign you out of all devices except this one. You&apos;ll
            need to sign in again on those devices.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button
            variant="destructive"
            onClick={handleRevokeAll}
            disabled={revokeAllMutation.isPending}
          >
            {revokeAllMutation.isPending ? <Spinner /> : "Sign out all"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
