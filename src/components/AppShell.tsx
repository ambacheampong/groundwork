import { Link } from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";
import { useTheme } from "@/lib/theme";
import { Moon, Sun, User } from "lucide-react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/MobileNav";
import { registerPushNotifications } from "@/lib/push-notifications";
import { Logo } from "@/components/Logo";

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    registerPushNotifications();
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <header className="glass sticky top-0 z-40 flex h-14 items-center justify-between gap-2 px-3 pt-safe sm:px-5">
            <div className="flex items-center gap-2">
              <SidebarTrigger
                aria-label="Toggle sidebar"
                className="rounded-xl hover:bg-muted"
              />
              <Link to="/feed" className="flex items-center gap-2 font-display text-base font-semibold sm:text-lg">
                <Logo className="size-7 rounded-lg" />
                Groundwork
              </Link>
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
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="rounded-xl"
                aria-label="Profile"
              >
                <Link to="/profile">
                  <User className="size-4" />
                </Link>
              </Button>
            </div>
          </header>
          <main className="min-w-0 flex-1 px-3 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="mx-auto w-full max-w-5xl min-w-0 animate-float-in pb-28 md:pb-0">
              {children}
            </div>
          </main>
          <MobileNav />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

