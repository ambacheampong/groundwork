import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listMySaved, listMyTracked } from "@/lib/user.functions";
import { AppShell } from "@/components/AppShell";
import { OpportunityCard } from "@/components/OpportunityCard";
import { voice } from "@/lib/voice";
import { Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({ meta: [{ title: "Saved — Groundwork" }] }),
  component: Saved,
});

function Saved() {
  const saved = useQuery({ queryKey: ["my-saved"], queryFn: () => listMySaved() });
  const tracked = useQuery({ queryKey: ["my-tracked"], queryFn: () => listMyTracked() });

  const opps = (saved.data ?? []).map((s: any) => s.opportunities).filter(Boolean);
  const orgs = (tracked.data ?? []).map((t: any) => t.organisations).filter(Boolean);

  return (
    <AppShell>
      <h1 className="font-display text-2xl sm:text-3xl md:text-4xl">Your shortlist</h1>
      <p className="mt-2 text-sm text-muted-foreground">Saved opportunities and tracked organisations.</p>

      <section className="mt-8">
        <h2 className="font-display text-2xl">Saved opportunities</h2>
        {opps.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {voice.empty.saved}
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3">
            {opps.map((o: any) => (
              <OpportunityCard key={o.id} opp={o} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Tracked organisations</h2>
        {orgs.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {voice.empty.tracked}
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {orgs.map((o: any) => (
              <Link
                key={o.id}
                to="/organisations/$slug"
                params={{ slug: o.slug }}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 hover:border-primary/40"
              >
                <div className="flex size-10 items-center justify-center rounded-md bg-muted">
                  <Building2 className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-display text-lg">{o.name}</p>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{o.type}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
