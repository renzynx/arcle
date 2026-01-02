"use client";

import { SETTING_METADATA, type SettingKey } from "@arcle/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@arcle/ui/components/card";
import { Input } from "@arcle/ui/components/input";
import { Label } from "@arcle/ui/components/label";
import { Switch } from "@arcle/ui/components/switch";
import type { AnyFieldApi } from "@tanstack/react-form";
import type { ReactNode } from "react";

interface SettingsGroupCardProps {
  title: string;
  description: string;
  settingKeys: readonly SettingKey[];
  renderField: (
    key: SettingKey,
    render: (field: AnyFieldApi) => ReactNode,
  ) => ReactNode;
}

export function SettingsGroupCard({
  title,
  description,
  settingKeys,
  renderField,
}: SettingsGroupCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {settingKeys.map((key) => {
          const meta = SETTING_METADATA[key];
          return renderField(key, (field) => (
            <div
              key={key}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b last:border-0"
            >
              <div className="space-y-0.5">
                <Label htmlFor={key} className="text-sm font-medium">
                  {meta.label}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {meta.description}
                </p>
              </div>
              {meta.type === "boolean" ? (
                <Switch
                  id={key}
                  checked={field.state.value === "true"}
                  onCheckedChange={(checked) =>
                    field.handleChange(checked ? "true" : "false")
                  }
                />
              ) : (
                <Input
                  id={key}
                  type={meta.type === "number" ? "number" : "text"}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className={meta.type === "number" ? "w-24" : "w-full sm:w-64"}
                />
              )}
            </div>
          ));
        })}
      </CardContent>
    </Card>
  );
}
