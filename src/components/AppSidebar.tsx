import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Compass, Building2, Bookmark, Settings, LogOut, LogIn, Bell, Users, ShieldCheck, HelpCircle, LifeBuoy } from "lucide-react";
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
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Logo } from "@/components/Logo";
import { useSessionUser } from "@/hooks/use-session-user";

const PUBLIC_NAV = [
  { to: "/feed", label: "Feed", icon: Compass },
  { to: "/organisations", label: "Organisations", icon: Building2 },
  { to: "/community", label: "Community", icon: Users },
];
const PRIVATE_NAV = [
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/saved", label: "Saved", icon: Bookmark },
  { to: "/settings", label: "Settings", icon: Settings },
];
const HELP_NAV = [
  { to: "/faq", label: "FAQ", icon: HelpCircle },
  { to: "/support", label: "Support", icon: LifeBuoy },
];

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const qc = useQueryClient();
  const navigate = useNavigate();
  const adminQ = useIsAdmin();
  const { signedIn } = useSessionUser();
  const NAV = signedIn ? [...PUBLIC_NAV, ...PRIVATE_NAV] : PUBLIC_NAV;

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/60">
      <SidebarHeader className="px-3 py-4">
        <Link to="/feed" aria-label="Home">
          <Logo className="size-9" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Discovery</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const active = path === item.to || path.startsWith(item.to + "/");
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
        <SidebarGroup>
          <SidebarGroupLabel>Help</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {HELP_NAV.map((item) => {
                const active = path === item.to || path.startsWith(item.to + "/");
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
        {adminQ.data?.admin ? (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={path.startsWith("/admin")} className="rounded-xl">
                    <Link to="/admin" className="flex items-center gap-2">
                      <ShieldCheck className="size-4" />
                      <span>Admin console</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {signedIn ? (
              <SidebarMenuButton onClick={signOut} className="rounded-xl">
                <LogOut className="size-4" />
                <span>Sign out</span>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton asChild className="rounded-xl">
                <Link to="/auth" className="flex items-center gap-2">
                  <LogIn className="size-4" />
                  <span>Sign in</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
