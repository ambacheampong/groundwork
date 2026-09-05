import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Bookmark, Building2, Compass, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_NAV = [
  { to: "/feed", label: "Feed", icon: Compass },
  { to: "/organisations", label: "Orgs", icon: Building2 },
  { to: "/community", label: "Community", icon: Users },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/saved", label: "Saved", icon: Bookmark },
];

export function MobileNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/90 backdrop-blur-lg md:hidden">
      <div className="grid grid-cols-5 items-stretch pb-safe">
        {MOBILE_NAV.map((item) => {
          const active = path === item.to || path.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5 shrink-0" />
              <span className="w-full truncate text-center">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
