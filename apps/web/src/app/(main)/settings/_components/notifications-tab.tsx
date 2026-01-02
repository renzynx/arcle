"use client";

import type { User } from "@arcle/auth-client";
import { Badge } from "@arcle/ui/components/badge";
import { Button } from "@arcle/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@arcle/ui/components/card";
import { Bell, ShieldCheck } from "@phosphor-icons/react";

interface NotificationsTabProps {
  user: User;
}

export function NotificationsTab(_props: NotificationsTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Choose what emails you want to receive.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
            <div className="flex items-start gap-3">
              <Bell className="mt-1 size-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <p className="font-medium">Marketing emails</p>
                <p className="text-sm text-muted-foreground">
                  Receive emails about new products, features, and more.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              Unsubscribe
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 size-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <p className="font-medium">Security emails</p>
                <p className="text-sm text-muted-foreground">
                  Receive emails about your account security.
                </p>
              </div>
            </div>
            <Badge variant="secondary">Required</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
