import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { getMyAccount } from "@/lib/account.functions";

export const Route = createFileRoute("/_authenticated/dashboard/user")({
  head: () => ({
    meta: [
      { title: "Your dashboard — Groundwork" },
      { name: "description", content: "Your saved opportunities, alerts and application shortcuts." },
      { property: "og:title", content: "Your dashboard — Groundwork" },
      { property: "og:description", content: "Your saved opportunities, alerts and application shortcuts." },
    ],
  }),
  component: UserDashboard,
});

function UserDashboard() {
  const q = useQuery({ queryKey: ["my-account"], queryFn: () => getMyAccount(), retry: false });
  const tiles = [
    { to: "/feed", title: "Feed", copy: "Everything open, filtered to you." },
    { to: "/saved", title: "Saved", copy: "The ones you meant to come back to." },
    { to: "/alerts", title: "Alerts", copy: "Deadlines don't announce themselves twice." },
    { to: "/profile", title: "Profile", copy: "Keep it current; it does the filtering." },
  ] as const;

  return (
    <AppShell>
      <h1 className="font-display text-2xl sm:text-3xl">
        {q.data?.display_name ? `Hello, ${q.data.display_name}.` : "Your dashboard."}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">Applicant account. Start where you left off.</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to} className="glass rounded-2xl p-5 transition hover:bg-muted/40">
            <div className="font-display text-lg">{t.title}</div>
            <p className="mt-1 text-sm text-muted-foreground">{t.copy}</p>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
