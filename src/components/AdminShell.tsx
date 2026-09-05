import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Users,
  MessageSquare,
  Download,
  ArrowLeft,
  Sun,
  Moon,
  RefreshCw,
  ShieldCheck,
  UserCog,
  BadgeCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/opportunities", label: "Opportunities", icon: ClipboardList },
  { to: "/admin/organisations", label: "Organisations", icon: Building2 },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/accounts", label: "Accounts & invites", icon: UserCog },
  { to: "/admin/verifications", label: "Verifications", icon: BadgeCheck },
  { to: "/admin/community", label: "Community", icon: MessageSquare },
  { to: "/admin/ingestion", label: "Ingestion", icon: RefreshCw },
  { to: "/admin/allowlist", label: "Admin allowlist", icon: ShieldCheck },
];

export function AdminShell({ children, title }: { children: ReactNode; title?: string }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar collapsible="icon" className="border-r border-border/60">
          <SidebarHeader className="px-3 py-4">
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-xl bg-foreground font-display text-lg font-semibold text-background">
                A
              </div>
              <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <span className="font-display text-sm font-semibold">Admin</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Groundwork</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Console</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV.map((item) => {
                    const active = item.exact ? path === item.to : path.startsWith(item.to);
                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton asChild isActive={active} className="rounded-xl">
                          <Link to={item.to} className="flex items-center gap-2">
                            <item.icon className="size-4" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="rounded-xl">
                  <Link to="/feed">
                    <ArrowLeft className="size-4" />
                    <span>Back to app</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut} className="rounded-xl">
                  <Download className="size-4" />
                  <span>Sign out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <header className="glass sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-border/40 px-3 sm:px-5">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="rounded-xl hover:bg-muted" />
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-foreground px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-background">
                  admin
                </span>
                <h1 className="font-display text-base sm:text-lg">{title ?? "Dashboard"}</h1>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
