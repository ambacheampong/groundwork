import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listOrganisations } from "@/lib/opportunities.functions";
import { listOrgViewCounts } from "@/lib/org-views.functions";
import { AppShell } from "@/components/AppShell";
import type { Organisation } from "@/lib/groundwork-types";
import { Building2, ShieldCheck, Eye } from "lucide-react";
import { voice } from "@/lib/voice";

const orgsOpts = queryOptions({
  queryKey: ["organisations"],
  queryFn: () => listOrganisations({ data: {} }),
});
const viewsOpts = queryOptions({
  queryKey: ["org-view-counts"],
  queryFn: () => listOrgViewCounts(),
});

export const Route = createFileRoute("/organisations/")({
  head: () => ({ meta: [{ title: "Organisations — Groundwork" }] }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(orgsOpts),
      context.queryClient.ensureQueryData(viewsOpts),
    ]);
  },
  component: OrgsList,
  errorComponent: ({ error }) => (
    <AppShell><p className="text-sm text-destructive">{error.message}</p></AppShell>
  ),
  notFoundComponent: () => <AppShell><p>Nothing here.</p></AppShell>,
});

function OrgsList() {
  const { data } = useSuspenseQuery(orgsOpts);
  const { data: counts = [] } = useSuspenseQuery(viewsOpts);
  const countByOrg = new Map(counts.map((c) => [c.org_id, Number(c.view_count)]));
  const orgs = (data ?? []) as unknown as Organisation[];
  const [q, setQ] = useState("");
  const filtered = orgs.filter((o) => o.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell>
      <h1 className="font-display text-2xl sm:text-3xl md:text-4xl">Organisations</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Companies, NGOs, foundations and academic institutions. Track the ones you care about.
      </p>

      <input
        placeholder="Search organisations"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mt-6 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />

      {filtered.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          {voice.empty.organisations}
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((o) => {
            const views = countByOrg.get(o.id) ?? 0;
            return (
              <Link
                key={o.id}
                to="/organisations/$slug"
                params={{ slug: o.slug }}
                className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Building2 className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate font-display text-lg group-hover:text-primary">{o.name}</h3>
                    {o.verified && <ShieldCheck className="size-3.5 text-accent" />}
                    <span
                      className="ml-auto inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                      title={`${views} ${views === 1 ? "visitor" : "visitors"}`}
                    >
                      <Eye className="size-3" /> {views}
                    </span>
                  </div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {o.type} {o.country && `· ${o.country}`}
                  </p>
                  {o.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{o.description}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
