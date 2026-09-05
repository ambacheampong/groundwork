import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getOrganisation } from "@/lib/opportunities.functions";
import { listMyTracked, toggleTrack } from "@/lib/user.functions";
import { AppShell } from "@/components/AppShell";
import { OpportunityCard } from "@/components/OpportunityCard";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { safeExternalHref } from "@/lib/safe-url";
import { recordOrgView } from "@/lib/org-views.functions";
import { useEffect } from "react";
import type { Opportunity, Organisation } from "@/lib/groundwork-types";
import { deriveStatus } from "@/lib/voice";
import { useAuthGate } from "@/hooks/use-auth-gate";

const orgOpts = (slug: string) =>
  queryOptions({
    queryKey: ["organisation", slug],
    queryFn: () => getOrganisation({ data: { slug } }),
  });

export const Route = createFileRoute("/organisations/$slug")({
  head: ({ loaderData }) => ({
    meta: [
      { title: `${(loaderData as any)?.org?.name ?? "Organisation"} — Groundwork` },
      {
        name: "description",
        content: (loaderData as any)?.org?.description ?? "Organisation on Groundwork.",
      },
    ],
  }),
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(orgOpts(params.slug));
    if (!data) throw notFound();
    return data;
  },
  component: OrgPage,
});

function OrgPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(orgOpts(slug));
  const org = (data as any).org as Organisation;
  const opps = (data as any).opportunities as Opportunity[];
  const qc = useQueryClient();
  const recordView = useServerFn(recordOrgView);
  useEffect(() => {
    recordView({ data: { orgId: org.id } }).catch(() => {});
  }, [org.id, recordView]);

  const { signedIn, requireAuth } = useAuthGate();
  const trackedQ = useQuery({ queryKey: ["my-tracked"], queryFn: () => listMyTracked(), enabled: signedIn });
  const isTracked = !!trackedQ.data?.some((t: any) => t.org_id === org.id);
  const toggle = useServerFn(toggleTrack);
  const trackMut = useMutation({
    mutationFn: () => toggle({ data: { org_id: org.id } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["my-tracked"] });
      toast(r.tracked ? "Tracked. We'll surface what they post." : "Untracked.");
    },
  });

  const active = opps.filter((o) => deriveStatus(o.opens_at, o.deadline_at) !== "closed");
  const past = opps.filter((o) => deriveStatus(o.opens_at, o.deadline_at) === "closed");

  return (
    <AppShell>
      <Link to="/organisations" className="text-sm text-muted-foreground hover:text-foreground">
        ← All organisations
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {org.type} {org.country && `· ${org.country}`}
          </p>
          <h1 className="mt-1 flex items-center gap-2 font-display text-2xl sm:text-3xl md:text-4xl">
            {org.name}
            {org.verified && <ShieldCheck className="size-5 text-accent" />}
          </h1>
          {org.description && (
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{org.description}</p>
          )}
          {org.website && (
            <a
              href={safeExternalHref(org.website)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {org.website.replace(/^https?:\/\//, "")} <ExternalLink className="size-3" />
            </a>
          )}
        </div>
        <button
          onClick={() => (requireAuth("track an organisation") ? trackMut.mutate() : undefined)}
          className={`rounded-md border px-4 py-2 text-sm font-medium ${
            isTracked
              ? "border-primary bg-primary/10 text-primary"
              : "border-border hover:bg-muted"
          }`}
        >
          {isTracked ? "Tracking" : "Track"}
        </button>
      </div>

      <h2 className="mt-10 font-display text-2xl">Active opportunities</h2>
      {active.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Nothing live just now.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3">
          {active.map((o) => (
            <OpportunityCard key={o.id} opp={o} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <>
          <h2 className="mt-10 font-display text-2xl">Past programmes</h2>
          <div className="mt-4 grid grid-cols-1 gap-3">
            {past.map((o) => (
              <OpportunityCard key={o.id} opp={o} />
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}
