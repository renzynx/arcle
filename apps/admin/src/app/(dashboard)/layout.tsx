"use client";

import { SidebarInset, SidebarProvider } from "@arcle/ui/components/sidebar";
import type { ReactNode } from "react";

import { AuthGuard } from "@/components/auth-guard";
import { Header } from "@/components/header";
import { AppSidebar } from "@/components/sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
