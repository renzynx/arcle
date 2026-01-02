import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const SettingKey = {
  SITE_NAME: "site_name",
  SITE_DESCRIPTION: "site_description",
  MAINTENANCE_MODE: "maintenance_mode",
  MAINTENANCE_MESSAGE: "maintenance_message",
  REGISTRATION_ENABLED: "registration_enabled",
  VIEW_CACHE_TTL: "view_cache_ttl",
  CDN_URL: "cdn_url",
  UPLOAD_MAX_SIZE_MB: "upload_max_size_mb",
  MEDIA_SIGNING_ENABLED: "media_signing_enabled",
  MEDIA_SIGNING_SECRET: "media_signing_secret",
  MEDIA_SIGNING_EXPIRY: "media_signing_expiry",
  SEO_KEYWORDS: "seo_keywords",
  SEO_OG_IMAGE: "seo_og_image",
  SEO_TWITTER_HANDLE: "seo_twitter_handle",
  SEO_GOOGLE_SITE_VERIFICATION: "seo_google_site_verification",
  SEO_ROBOTS: "seo_robots",
  SEO_CANONICAL_URL: "seo_canonical_url",
} as const;

export type SettingKey = (typeof SettingKey)[keyof typeof SettingKey];

export const SETTING_KEYS = Object.values(SettingKey);

export type SettingMetadata = {
  key: SettingKey;
  label: string;
  description: string;
  type: "text" | "boolean" | "number";
  defaultValue: string;
  group: "general" | "features" | "performance" | "media" | "seo";
};

export const SETTING_METADATA: Record<SettingKey, SettingMetadata> = {
  [SettingKey.SITE_NAME]: {
    key: SettingKey.SITE_NAME,
    label: "Site Name",
    description: "The name displayed across the site",
    type: "text",
    defaultValue: "Arcle",
    group: "general",
  },
  [SettingKey.SITE_DESCRIPTION]: {
    key: SettingKey.SITE_DESCRIPTION,
    label: "Site Description",
    description: "Meta description for SEO purposes",
    type: "text",
    defaultValue: "Read manga online",
    group: "general",
  },
  [SettingKey.MAINTENANCE_MODE]: {
    key: SettingKey.MAINTENANCE_MODE,
    label: "Maintenance Mode",
    description: "Enable to show maintenance page to users",
    type: "boolean",
    defaultValue: "false",
    group: "features",
  },
  [SettingKey.MAINTENANCE_MESSAGE]: {
    key: SettingKey.MAINTENANCE_MESSAGE,
    label: "Maintenance Message",
    description: "Custom message shown during maintenance",
    type: "text",
    defaultValue:
      "We're currently performing scheduled maintenance. Please check back soon.",
    group: "features",
  },
  [SettingKey.REGISTRATION_ENABLED]: {
    key: SettingKey.REGISTRATION_ENABLED,
    label: "Registration Enabled",
    description: "Allow new user registrations",
    type: "boolean",
    defaultValue: "true",
    group: "features",
  },
  [SettingKey.VIEW_CACHE_TTL]: {
    key: SettingKey.VIEW_CACHE_TTL,
    label: "View Cache TTL",
    description: "How long to cache view deduplication (e.g., 24h, 30m, 1d)",
    type: "text",
    defaultValue: "24h",
    group: "performance",
  },
  [SettingKey.CDN_URL]: {
    key: SettingKey.CDN_URL,
    label: "CDN URL",
    description: "Base URL for media CDN (leave empty for local)",
    type: "text",
    defaultValue: "",
    group: "media",
  },
  [SettingKey.UPLOAD_MAX_SIZE_MB]: {
    key: SettingKey.UPLOAD_MAX_SIZE_MB,
    label: "Max Upload Size (MB)",
    description: "Maximum file upload size in megabytes",
    type: "number",
    defaultValue: "10",
    group: "media",
  },
  [SettingKey.MEDIA_SIGNING_ENABLED]: {
    key: SettingKey.MEDIA_SIGNING_ENABLED,
    label: "Media URL Signing",
    description: "Require signed URLs to access page images",
    type: "boolean",
    defaultValue: "false",
    group: "media",
  },
  [SettingKey.MEDIA_SIGNING_SECRET]: {
    key: SettingKey.MEDIA_SIGNING_SECRET,
    label: "Signing Secret",
    description: "Auto-generated HMAC secret for URL signing (do not share)",
    type: "text",
    defaultValue: "",
    group: "media",
  },
  [SettingKey.MEDIA_SIGNING_EXPIRY]: {
    key: SettingKey.MEDIA_SIGNING_EXPIRY,
    label: "URL Expiry",
    description: "How long signed URLs remain valid (e.g., 1h, 30m, 2d)",
    type: "text",
    defaultValue: "1h",
    group: "media",
  },
  [SettingKey.SEO_KEYWORDS]: {
    key: SettingKey.SEO_KEYWORDS,
    label: "Meta Keywords",
    description:
      "Comma-separated keywords for SEO (e.g., manga, comics, read online)",
    type: "text",
    defaultValue: "manga, comics, read online, webtoon",
    group: "seo",
  },
  [SettingKey.SEO_OG_IMAGE]: {
    key: SettingKey.SEO_OG_IMAGE,
    label: "Default OG Image",
    description:
      "Default image URL for social media sharing (1200x630 recommended)",
    type: "text",
    defaultValue: "",
    group: "seo",
  },
  [SettingKey.SEO_TWITTER_HANDLE]: {
    key: SettingKey.SEO_TWITTER_HANDLE,
    label: "Twitter Handle",
    description: "Twitter/X username for cards (e.g., @yourusername)",
    type: "text",
    defaultValue: "",
    group: "seo",
  },
  [SettingKey.SEO_GOOGLE_SITE_VERIFICATION]: {
    key: SettingKey.SEO_GOOGLE_SITE_VERIFICATION,
    label: "Google Site Verification",
    description: "Google Search Console verification code",
    type: "text",
    defaultValue: "",
    group: "seo",
  },
  [SettingKey.SEO_ROBOTS]: {
    key: SettingKey.SEO_ROBOTS,
    label: "Robots Meta",
    description: "Default robots directive (e.g., index, follow)",
    type: "text",
    defaultValue: "index, follow",
    group: "seo",
  },
  [SettingKey.SEO_CANONICAL_URL]: {
    key: SettingKey.SEO_CANONICAL_URL,
    label: "Canonical URL",
    description: "Base canonical URL for the site (e.g., https://example.com)",
    type: "text",
    defaultValue: "",
    group: "seo",
  },
};

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
