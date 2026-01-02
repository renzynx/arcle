import { getSetting, getSettingBool } from "@arcle/cache";
import { SettingKey } from "@arcle/database/schema/settings";
import { signUrl } from "@arcle/signing";

const DEFAULT_BASE_URL = Bun.env.GATEWAY_URL || "http://localhost:3000";
const DEFAULT_EXPIRY = "1h";

let cachedBaseUrl: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000;

type SigningConfig = {
  enabled: boolean;
  secret: string;
  expiry: string;
};

let cachedSigningConfig: SigningConfig | null = null;
let signingCacheTimestamp = 0;

export function clearSigningConfigCache(): void {
  cachedSigningConfig = null;
  signingCacheTimestamp = 0;
}

async function getBaseUrl(): Promise<string> {
  const now = Date.now();
  if (cachedBaseUrl && now - cacheTimestamp < CACHE_TTL) {
    return cachedBaseUrl;
  }

  const cdnUrl = await getSetting(SettingKey.CDN_URL);
  const baseUrl = cdnUrl || DEFAULT_BASE_URL;
  cachedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  cacheTimestamp = now;
  return cachedBaseUrl;
}

async function getSigningConfig(): Promise<SigningConfig> {
  const now = Date.now();
  if (cachedSigningConfig && now - signingCacheTimestamp < CACHE_TTL) {
    return cachedSigningConfig;
  }

  const [enabled, secret, expiry] = await Promise.all([
    getSettingBool(SettingKey.MEDIA_SIGNING_ENABLED, false),
    getSetting(SettingKey.MEDIA_SIGNING_SECRET),
    getSetting(SettingKey.MEDIA_SIGNING_EXPIRY),
  ]);

  cachedSigningConfig = {
    enabled: enabled && !!secret,
    secret: secret || "",
    expiry: expiry || DEFAULT_EXPIRY,
  };
  signingCacheTimestamp = now;
  return cachedSigningConfig;
}

function buildSignedPageUrl(
  baseUrl: string,
  urlPath: string,
  signingPath: string,
  config: SigningConfig,
): string {
  const params = signUrl(config.secret, signingPath, config.expiry);
  return `${baseUrl}${urlPath}?ex=${params.ex}&is=${params.is}&hm=${params.hm}`;
}

export async function toCoverUrl(
  filename: string | null | undefined,
): Promise<string | null> {
  if (!filename) return null;
  if (filename.startsWith("http://") || filename.startsWith("https://")) {
    return filename;
  }
  const baseUrl = await getBaseUrl();
  return `${baseUrl}/api/media/images/covers/${filename}`;
}

export async function toPageUrl(filename: string): Promise<string> {
  if (filename.startsWith("http://") || filename.startsWith("https://")) {
    return filename;
  }
  const baseUrl = await getBaseUrl();
  const urlPath = `/api/media/images/pages/${filename}`;
  const signingPath = `/images/pages/${filename}`;
  const config = await getSigningConfig();

  if (config.enabled) {
    return buildSignedPageUrl(baseUrl, urlPath, signingPath, config);
  }

  return `${baseUrl}${urlPath}`;
}

export async function withCoverUrl<T extends { coverImage?: string | null }>(
  item: T,
): Promise<T> {
  if (!item.coverImage) return item;
  return {
    ...item,
    coverImage: await toCoverUrl(item.coverImage),
  };
}

export async function withCoverUrls<T extends { coverImage?: string | null }>(
  items: T[],
): Promise<T[]> {
  const baseUrl = await getBaseUrl();
  return items.map((item) => {
    if (!item.coverImage) return item;
    if (
      item.coverImage.startsWith("http://") ||
      item.coverImage.startsWith("https://")
    ) {
      return item;
    }
    return {
      ...item,
      coverImage: `${baseUrl}/api/media/images/covers/${item.coverImage}`,
    };
  });
}

export async function withPageUrls<T extends { imageUrl?: string }>(
  items: T[],
): Promise<T[]> {
  const baseUrl = await getBaseUrl();
  const config = await getSigningConfig();

  return items.map((item) => {
    if (!item.imageUrl) return item;
    if (
      item.imageUrl.startsWith("http://") ||
      item.imageUrl.startsWith("https://")
    ) {
      return item;
    }

    const urlPath = `/api/media/images/pages/${item.imageUrl}`;
    const signingPath = `/images/pages/${item.imageUrl}`;

    if (config.enabled) {
      return {
        ...item,
        imageUrl: buildSignedPageUrl(baseUrl, urlPath, signingPath, config),
      };
    }

    return {
      ...item,
      imageUrl: `${baseUrl}${urlPath}`,
    };
  });
}

export async function withPageUrl<T extends { imageUrl?: string }>(
  item: T,
): Promise<T> {
  if (!item.imageUrl) return item;
  if (
    item.imageUrl.startsWith("http://") ||
    item.imageUrl.startsWith("https://")
  ) {
    return item;
  }
  const baseUrl = await getBaseUrl();
  const urlPath = `/api/media/images/pages/${item.imageUrl}`;
  const signingPath = `/images/pages/${item.imageUrl}`;
  const config = await getSigningConfig();

  if (config.enabled) {
    return {
      ...item,
      imageUrl: buildSignedPageUrl(baseUrl, urlPath, signingPath, config),
    };
  }

  return {
    ...item,
    imageUrl: `${baseUrl}${urlPath}`,
  };
}
