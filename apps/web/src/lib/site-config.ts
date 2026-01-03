import { cache } from "react";

const DEFAULT_SITE_NAME = "Arcle";
const DEFAULT_SITE_DESCRIPTION = "Read manga online";

export type SiteConfig = {
  siteName: string;
  siteDescription: string;
  seoKeywords: string;
  seoOgImage: string;
  seoTwitterHandle: string;
  seoGoogleSiteVerification: string;
  seoRobots: string;
  seoCanonicalUrl: string;
};

const gatewayUrl = process.env.GATEWAY_URL || "http://localhost:3000";

export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  try {
    const res = await fetch(`${gatewayUrl}/api/catalog/settings`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch settings");
    }

    const settings: Record<string, string> = await res.json();

    return {
      siteName: settings.site_name || DEFAULT_SITE_NAME,
      siteDescription: settings.site_description || DEFAULT_SITE_DESCRIPTION,
      seoKeywords: settings.seo_keywords || "",
      seoOgImage: settings.seo_og_image || "",
      seoTwitterHandle: settings.seo_twitter_handle || "",
      seoGoogleSiteVerification: settings.seo_google_site_verification || "",
      seoRobots: settings.seo_robots || "index, follow",
      seoCanonicalUrl: settings.seo_canonical_url || "",
    };
  } catch {
    return {
      siteName: DEFAULT_SITE_NAME,
      siteDescription: DEFAULT_SITE_DESCRIPTION,
      seoKeywords: "",
      seoOgImage: "",
      seoTwitterHandle: "",
      seoGoogleSiteVerification: "",
      seoRobots: "index, follow",
      seoCanonicalUrl: "",
    };
  }
});
