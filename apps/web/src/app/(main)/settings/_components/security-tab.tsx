"use client";

import type { User } from "@arcle/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@arcle/ui/components/card";
import { PasskeySection } from "./passkey-section";
import { SessionsSection } from "./sessions-section";
import { TwoFactorSection } from "./two-factor-section";

interface SecurityTabProps {
  user: User;
}

export function SecurityTab({ user }: SecurityTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account using an
            authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TwoFactorSection user={user} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Passkeys</CardTitle>
          <CardDescription>
            Sign in securely using biometrics or security keys without a
            password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasskeySection />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage your active sessions across all devices. Revoke access to
            sessions you don&apos;t recognize.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SessionsSection />
        </CardContent>
      </Card>
    </div>
  );
}
