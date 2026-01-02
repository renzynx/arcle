import { get } from "./cache.ts";
import { CacheKey } from "./keys.ts";

export type SettingsMap = Record<string, string>;

export async function getSettings(): Promise<SettingsMap> {
  const cached = await get<SettingsMap>(CacheKey.settings());
  return cached ?? {};
}

export async function getSetting(key: string): Promise<string | null> {
  const settings = await getSettings();
  return settings[key] ?? null;
}

export async function getSettingBool(
  key: string,
  defaultValue = false,
): Promise<boolean> {
  const value = await getSetting(key);
  if (value === null) return defaultValue;
  return value === "true";
}

export async function getSettingNumber(
  key: string,
  defaultValue: number,
): Promise<number> {
  const value = await getSetting(key);
  if (value === null) return defaultValue;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}
