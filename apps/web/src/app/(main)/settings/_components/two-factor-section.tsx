"use client";

import type { User } from "@arcle/auth-client";
import { DisableTwoFactor, EnableTwoFactor } from "./two-factor";

interface TwoFactorSectionProps {
  user: User;
}

export function TwoFactorSection({ user }: TwoFactorSectionProps) {
  if (user.twoFactorEnabled) {
    return <DisableTwoFactor />;
  }
  return <EnableTwoFactor />;
}
