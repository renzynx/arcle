import {
  SETTING_KEYS,
  SETTING_METADATA,
  type SettingKey,
} from "@arcle/api-client";

export type SettingsFormValues = Record<SettingKey, string>;

const HIDDEN_SETTINGS: SettingKey[] = ["media_signing_secret" as SettingKey];

export const SETTINGS_BY_GROUP = {
  general: SETTING_KEYS.filter(
    (k) =>
      SETTING_METADATA[k].group === "general" && !HIDDEN_SETTINGS.includes(k),
  ),
  features: SETTING_KEYS.filter(
    (k) =>
      SETTING_METADATA[k].group === "features" && !HIDDEN_SETTINGS.includes(k),
  ),
  performance: SETTING_KEYS.filter(
    (k) =>
      SETTING_METADATA[k].group === "performance" &&
      !HIDDEN_SETTINGS.includes(k),
  ),
  media: SETTING_KEYS.filter(
    (k) =>
      SETTING_METADATA[k].group === "media" && !HIDDEN_SETTINGS.includes(k),
  ),
  seo: SETTING_KEYS.filter(
    (k) => SETTING_METADATA[k].group === "seo" && !HIDDEN_SETTINGS.includes(k),
  ),
} as const;

export type SettingsGroup = keyof typeof SETTINGS_BY_GROUP;

export function getDefaultValues(): SettingsFormValues {
  const defaults = {} as SettingsFormValues;
  for (const key of SETTING_KEYS) {
    defaults[key] = SETTING_METADATA[key].defaultValue;
  }
  return defaults;
}
