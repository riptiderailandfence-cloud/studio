"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { UserInitializer } from "@/components/dashboard/user-initializer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserInitializer>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 sticky top-0 z-10">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex flex-1 items-center justify-between">
              <h1 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Evergreen Fencing Co.
              </h1>
              <Button asChild size="sm" className="gap-2">
                <Link href="/estimates/new">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Estimate</span>
                  <span className="sm:hidden">New</span>
                </Link>
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6 bg-background/50">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </UserInitializer>
  );
}
