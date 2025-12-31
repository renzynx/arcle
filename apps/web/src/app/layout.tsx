import { Nunito_Sans } from "next/font/google"
import "@arcle/ui/globals.css"
import { Providers } from "@/components/providers"

const nunitoSans = Nunito_Sans({ variable: '--font-sans' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={nunitoSans.variable}>
      <body
        className="antialiased"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
