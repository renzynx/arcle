"use client";

import { AuthProvider } from "@arcle/auth-client";
import { QueryProvider } from "@arcle/query";
import { Toaster } from "@arcle/ui/components/sonner";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

export function Providers({
  children,
  gatewayUrl,
}: {
  children: ReactNode;
  gatewayUrl: string;
}) {
  return (
    <QueryProvider>
      <AuthProvider gatewayUrl={gatewayUrl}>
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          {children}
          <Toaster />
        </NextThemesProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
