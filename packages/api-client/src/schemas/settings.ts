import {
  SETTING_KEYS,
  SETTING_METADATA,
  SettingKey,
  type SettingMetadata,
} from "@arcle/database/schema/settings";
import { z } from "zod";

export { SETTING_KEYS, SETTING_METADATA, SettingKey, type SettingMetadata };

export const SettingKeySchema = z.enum(SETTING_KEYS as [string, ...string[]]);

export const Setting = z.object({
  key: SettingKeySchema,
  value: z.string(),
  updatedAt: z.coerce.date(),
});

export const SettingsMap = z.record(z.string(), z.string());

export const UpdateSettingInput = z.object({
  value: z.string(),
});

export const BulkUpdateSettingsInput = z.object({
  settings: z.array(
    z.object({
      key: SettingKeySchema,
      value: z.string(),
    }),
  ),
});

export type Setting = z.infer<typeof Setting>;
export type SettingsMap = z.infer<typeof SettingsMap>;
export type UpdateSettingInput = z.infer<typeof UpdateSettingInput>;
export type BulkUpdateSettingsInput = z.infer<typeof BulkUpdateSettingsInput>;
