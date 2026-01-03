import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "@arcle/ui/globals.css";
import { Providers } from "@/components/providers";
import { SiteConfigProvider } from "@/components/site-config-provider";
import { getSiteConfig } from "@/lib/site-config";

const nunitoSans = Nunito_Sans({ variable: "--font-sans" });

const gatewayUrl = process.env.GATEWAY_URL || "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();

  const metadata: Metadata = {
    title: {
      default: config.siteName,
      template: `%s | ${config.siteName}`,
    },
    description: config.siteDescription,
    robots: config.seoRobots || "index, follow",
  };

  if (config.seoKeywords) {
    metadata.keywords = config.seoKeywords.split(",").map((k) => k.trim());
  }

  if (config.seoCanonicalUrl) {
    metadata.metadataBase = new URL(config.seoCanonicalUrl);
  }

  if (config.seoGoogleSiteVerification) {
    metadata.verification = {
      google: config.seoGoogleSiteVerification,
    };
  }

  if (config.seoOgImage || config.siteDescription) {
    metadata.openGraph = {
      title: config.siteName,
      description: config.siteDescription,
      siteName: config.siteName,
      type: "website",
    };

    if (config.seoOgImage) {
      metadata.openGraph.images = [config.seoOgImage];
    }
  }

  if (config.seoTwitterHandle || config.seoOgImage) {
    const twitter: NonNullable<Metadata["twitter"]> = {
      card: config.seoOgImage ? "summary_large_image" : "summary",
      title: config.siteName,
      description: config.siteDescription,
    };

    if (config.seoTwitterHandle) {
      twitter.site = config.seoTwitterHandle;
      twitter.creator = config.seoTwitterHandle;
    }

    if (config.seoOgImage) {
      twitter.images = [config.seoOgImage];
    }

    metadata.twitter = twitter;
  }

  return metadata;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteConfig = await getSiteConfig();

  return (
    <html lang="en" suppressHydrationWarning className={nunitoSans.variable}>
      <body className="antialiased">
        <Providers gatewayUrl={gatewayUrl}>
          <SiteConfigProvider config={siteConfig}>
            {children}
          </SiteConfigProvider>
        </Providers>
      </body>
    </html>
  );
}
