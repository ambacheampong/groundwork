import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  listMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/notifications.functions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Activity, Sparkles, Settings as Cog, Check, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({ meta: [{ title: "Alerts — Groundwork" }] }),
  component: AlertsPage,
  errorComponent: ({ error }) => (
    <AppShell><p className="text-sm text-destructive">{error.message}</p></AppShell>
  ),
  notFoundComponent: () => <AppShell><p>Nothing here.</p></AppShell>,
});

type Kind = "activity" | "opportunity" | "system";

const META: Record<Kind, { label: string; icon: typeof Activity; empty: string }> = {
  activity: { label: "Activity", icon: Activity, empty: "No activity yet. Save something, follow someone, do anything." },
  opportunity: { label: "Opportunities", icon: Sparkles, empty: "Quiet for now — new opportunities will land here." },
  system: { label: "System", icon: Cog, empty: "No system messages." },
};

function AlertsPage() {
  const listFn = useServerFn(listMyNotifications);
  const markFn = useServerFn(markNotificationRead);
  const markAllFn = useServerFn(markAllNotificationsRead);
  const qc = useQueryClient();
  const [tab, setTab] = useState<Kind>("activity");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listFn(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["notifications"] });
  const markOne = useMutation({ mutationFn: (id: string) => markFn({ data: { id, read: true } }), onSuccess: invalidate });
  const markAll = useMutation({ mutationFn: (kind?: Kind) => markAllFn({ data: kind ? { kind } : {} }), onSuccess: invalidate });

  const filtered = items.filter((n: any) => n.kind === tab);
  const unreadByKind = (k: Kind) => items.filter((n: any) => n.kind === k && !n.read_at).length;

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl">Alerts</h1>
          <p className="mt-2 text-sm text-muted-foreground">Everything worth your attention, in one place.</p>
        </div>
        <button
          onClick={() => markAll.mutate(undefined)}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted"
        >
          <CheckCheck className="size-4" /> Mark all read
        </button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Kind)} className="mt-6">
        <TabsList className="rounded-xl">
          {(Object.keys(META) as Kind[]).map((k) => {
            const Icon = META[k].icon;
            const n = unreadByKind(k);
            return (
              <TabsTrigger key={k} value={k} className="gap-2 rounded-lg">
                <Icon className="size-4" /> {META[k].label}
                {n > 0 && (
                  <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                    {n}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(Object.keys(META) as Kind[]).map((k) => (
          <TabsContent key={k} value={k} className="mt-4">
            <div className="mb-3 flex justify-end">
              <button
                onClick={() => markAll.mutate(k)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Mark {META[k].label.toLowerCase()} as read
              </button>
            </div>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
                <Bell className="mx-auto mb-3 size-6 opacity-50" />
                {META[k].empty}
              </div>
            ) : (
              <ul className="space-y-2">
                {filtered.map((n: any) => (
                  <li
                    key={n.id}
                    className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors ${
                      n.read_at ? "border-border bg-card/50" : "border-primary/40 bg-card"
                    }`}
                  >
                    <div className="mt-0.5 size-2 shrink-0 rounded-full bg-primary" style={{ opacity: n.read_at ? 0 : 1 }} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{n.title}</p>
                      {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
                        {n.link && (
                          <a href={n.link} className="text-primary hover:underline">Open</a>
                        )}
                      </div>
                    </div>
                    {!n.read_at && (
                      <button
                        onClick={() => markOne.mutate(n.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
                      >
                        <Check className="size-3.5" /> Mark read
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </AppShell>
  );
}
