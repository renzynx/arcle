import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "@arcle/ui/globals.css";
import { connection } from "next/server";
import { Providers } from "@/components/providers";

const nunitoSans = Nunito_Sans({ variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "none",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  const gatewayUrl = process.env.GATEWAY_URL || "http://localhost:3000";

  return (
    <html lang="en" suppressHydrationWarning className={nunitoSans.variable}>
      <head>
        <meta
          name="robots"
          content="noindex, nofollow, noarchive, nosnippet, noimageindex, notranslate"
        />
        <meta
          name="googlebot"
          content="noindex, nofollow, noarchive, nosnippet, noimageindex"
        />
      </head>
      <body className="antialiased">
        <Providers gatewayUrl={gatewayUrl}>{children}</Providers>
      </body>
    </html>
  );
}
