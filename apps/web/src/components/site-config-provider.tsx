"use client";

import { createContext, type ReactNode, useContext } from "react";

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

const SiteConfigContext = createContext<SiteConfig | null>(null);

export function SiteConfigProvider({
  children,
  config,
}: {
  children: ReactNode;
  config: SiteConfig;
}) {
  return (
    <SiteConfigContext.Provider value={config}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig(): SiteConfig {
  const context = useContext(SiteConfigContext);
  if (!context) {
    return {
      siteName: "Arcle",
      siteDescription: "Read manga online",
      seoKeywords: "",
      seoOgImage: "",
      seoTwitterHandle: "",
      seoGoogleSiteVerification: "",
      seoRobots: "index, follow",
      seoCanonicalUrl: "",
    };
  }
  return context;
}
