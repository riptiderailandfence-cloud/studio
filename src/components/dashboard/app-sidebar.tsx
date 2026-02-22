"use client";

import * as React from "react";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Paintbrush, 
  FileText, 
  UserCircle, 
  Settings,
  HardHat,
  CalendarDays,
  ChevronRight,
  Briefcase,
  TrendingUp
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "CRM (Customers)", url: "/crm", icon: Users },
  { title: "Schedule", url: "/schedule", icon: CalendarDays },
  { title: "Jobs (Job Packs)", url: "/jobs", icon: Briefcase },
  { title: "Job Costing", url: "/job-costing", icon: TrendingUp },
  { title: "Materials", url: "/materials", icon: Package },
  { 
    title: "Styles & Types", 
    url: "/styles/fences", 
    icon: Paintbrush,
    isActive: true,
    items: [
      { title: "Fence Styles", url: "/styles/fences" },
      { title: "Post Types", url: "/styles/posts" },
      { title: "Gate Styles", url: "/styles/gates" },
    ]
  },
  { title: "Estimates", url: "/estimates", icon: FileText },
  { title: "Crew Management", url: "/crew", icon: HardHat },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2 font-bold text-primary">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              P
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent />
        <SidebarFooter />
      </Sidebar>
    );
  }

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2 font-bold text-primary">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            P
          </div>
          <span className="group-data-[collapsible=icon]:hidden">PillarPath</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const hasSubItems = item.items && item.items.length > 0;
                
                if (hasSubItems) {
                  return (
                    <Collapsible
                      key={item.title}
                      asChild
                      defaultOpen={pathname.startsWith("/styles")}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title}>
                            <item.icon />
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items?.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                  <Link href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Profile">
              <Link href="/profile">
                <UserCircle />
                <span>My Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
