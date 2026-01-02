import { getSetting, getSettingBool } from "@arcle/cache";
import { SettingKey } from "@arcle/database/schema/settings";

const DEFAULT_EXPIRY = "1h";

export type SigningConfig = {
  enabled: boolean;
  secret: string;
  expiry: string;
};

export async function getSigningConfig(): Promise<SigningConfig> {
  const enabled = await getSettingBool(SettingKey.MEDIA_SIGNING_ENABLED, false);

  if (!enabled) {
    return { enabled: false, secret: "", expiry: DEFAULT_EXPIRY };
  }

  const secret = await getSetting(SettingKey.MEDIA_SIGNING_SECRET);

  if (!secret) {
    return { enabled: false, secret: "", expiry: DEFAULT_EXPIRY };
  }

  const expiry =
    (await getSetting(SettingKey.MEDIA_SIGNING_EXPIRY)) ?? DEFAULT_EXPIRY;

  return { enabled, secret, expiry };
}
