"use client";

import { SETTING_KEYS, type SettingKey } from "@arcle/api-client";
import { Button } from "@arcle/ui/components/button";
import { FloppyDisk } from "@phosphor-icons/react";
import { useForm } from "@tanstack/react-form";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useBulkUpdateSettingsMutation,
  useUploadOgImageMutation,
} from "@/lib/mutations";
import {
  getDefaultValues,
  SETTINGS_BY_GROUP,
  type SettingsFormValues,
} from "./constants";
import { FloatingSaveBar } from "./floating-save-bar";
import { SecurityCard } from "./security-card";
import { SeoCard } from "./seo-card";
import { SettingsGroupCard } from "./settings-group-card";

interface SettingsFormProps {
  initialValues: Partial<SettingsFormValues>;
}

export function SettingsForm({ initialValues }: SettingsFormProps) {
  const bulkUpdateMutation = useBulkUpdateSettingsMutation();
  const uploadOgImageMutation = useUploadOgImageMutation();
  const topButtonWrapperRef = useRef<HTMLDivElement>(null);
  const [showBottomBar, setShowBottomBar] = useState(false);
  const [pendingOgFile, setPendingOgFile] = useState<File | null>(null);
  const [currentValues, setCurrentValues] = useState<SettingsFormValues | null>(
    null,
  );

  const mergedValues = useMemo(
    () =>
      ({
        ...getDefaultValues(),
        ...initialValues,
      }) as SettingsFormValues,
    [initialValues],
  );

  const isDirty = useMemo(() => {
    if (pendingOgFile !== null) return true;
    if (!currentValues) return false;

    for (const key of SETTING_KEYS) {
      if (currentValues[key] !== mergedValues[key]) {
        return true;
      }
    }
    return false;
  }, [currentValues, mergedValues, pendingOgFile]);

  const form = useForm({
    defaultValues: mergedValues,
    onSubmit: async ({ value }) => {
      try {
        let ogImageUrl = value.seo_og_image;

        if (pendingOgFile) {
          const result = await uploadOgImageMutation.mutateAsync(pendingOgFile);
          ogImageUrl = result.url;
          setPendingOgFile(null);
        }

        const validKeys = new Set<string>(SETTING_KEYS);
        const updates = Object.entries({
          ...value,
          seo_og_image: ogImageUrl,
        })
          .filter(([key]) => validKeys.has(key))
          .map(([key, val]) => ({
            key,
            value: val,
          }));

        await bulkUpdateMutation.mutateAsync(updates);
        toast.success("Settings saved successfully");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save settings",
        );
      }
    },
  });

  const handleFieldChange = useCallback(() => {
    setCurrentValues(form.state.values as SettingsFormValues);
  }, [form.state.values]);

  const renderField = (
    key: SettingKey,
    render: (
      field: Parameters<Parameters<typeof form.Field>[0]["children"]>[0],
    ) => ReactNode,
  ) => (
    <form.Field key={key} name={key}>
      {(field) => {
        const originalOnChange = field.handleChange;
        const wrappedField = {
          ...field,
          handleChange: (value: string) => {
            originalOnChange(value);
            setTimeout(handleFieldChange, 0);
          },
        };
        return render(wrappedField as typeof field);
      }}
    </form.Field>
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: form.reset is stable
  useEffect(() => {
    const newValues = {
      ...getDefaultValues(),
      ...initialValues,
    } as SettingsFormValues;

    form.update({
      defaultValues: newValues,
    });
    form.reset();
  }, [JSON.stringify(initialValues)]);

  useEffect(() => {
    const wrapper = topButtonWrapperRef.current;
    if (!wrapper) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setShowBottomBar(!entry.isIntersecting);
        }
      },
      { threshold: 0 },
    );

    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Configure site-wide settings and preferences.
          </p>
        </div>
        <div ref={topButtonWrapperRef}>
          <Button type="submit" disabled={form.state.isSubmitting}>
            <FloppyDisk className="mr-2 size-4" />
            {form.state.isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <SettingsGroupCard
        title="General"
        description="Basic site information and branding"
        settingKeys={SETTINGS_BY_GROUP.general}
        renderField={renderField}
      />

      <SettingsGroupCard
        title="Features"
        description="Enable or disable site features"
        settingKeys={SETTINGS_BY_GROUP.features}
        renderField={renderField}
      />

      <SettingsGroupCard
        title="Performance"
        description="Cache and performance settings"
        settingKeys={SETTINGS_BY_GROUP.performance}
        renderField={renderField}
      />

      <SettingsGroupCard
        title="Media"
        description="CDN and upload settings"
        settingKeys={SETTINGS_BY_GROUP.media}
        renderField={renderField}
      />

      <form.Field name="seo_og_image">
        {(field) => (
          <SeoCard
            renderField={renderField}
            ogImageValue={field.state.value}
            onOgImageChange={(url) => {
              field.handleChange(url);
              setTimeout(handleFieldChange, 0);
            }}
            pendingFile={pendingOgFile}
            onPendingFileChange={setPendingOgFile}
          />
        )}
      </form.Field>

      <SecurityCard />

      <FloatingSaveBar
        show={showBottomBar && isDirty}
        isSubmitting={form.state.isSubmitting}
      />
    </form>
  );
}
