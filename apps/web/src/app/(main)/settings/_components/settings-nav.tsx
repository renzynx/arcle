"use client";

import { Button } from "@arcle/ui/components/button";
import {
  Bell,
  Eye,
  Gear,
  ShieldCheck,
  UserCircle,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";

export interface SettingsTab {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  description: string;
}

export const settingsTabs: SettingsTab[] = [
  {
    id: "profile",
    label: "Profile",
    icon: UserCircle,
    description: "Manage your public profile and personal details.",
  },
  {
    id: "security",
    label: "Security",
    icon: ShieldCheck,
    description: "Keep your account secure with 2FA and passkeys.",
  },
  {
    id: "preferences",
    label: "Preferences",
    icon: Gear,
    description: "Customize your interface and experience.",
  },
  {
    id: "privacy",
    label: "Privacy",
    icon: Eye,
    description: "Control your data and tracking preferences.",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    description: "Control how and when we communicate with you.",
  },
];

interface SettingsNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function SettingsNav({ activeTab, onTabChange }: SettingsNavProps) {
  return (
    <aside className="lg:w-64 shrink-0">
      <nav className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1 overflow-x-auto pb-4 lg:pb-0">
        {settingsTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant={isActive ? "secondary" : "ghost"}
              className={`justify-start whitespace-nowrap ${
                isActive ? "font-medium" : "text-muted-foreground"
              }`}
              onClick={() => onTabChange(tab.id)}
            >
              <Icon className="mr-2 size-5" />
              {tab.label}
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}
