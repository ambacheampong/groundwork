import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getOpportunity } from "@/lib/opportunities.functions";
import { toggleSave, listMySaved } from "@/lib/user.functions";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { categoryLabel, deadlineCopy, deriveStatus } from "@/lib/voice";
import { ExternalLink, Bookmark, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { safeExternalHref } from "@/lib/safe-url";
import { useAuthGate } from "@/hooks/use-auth-gate";

const oppOpts = (id: string) =>
  queryOptions({
    queryKey: ["opportunity", id],
    queryFn: () => getOpportunity({ data: { id } }),
  });

export const Route = createFileRoute("/opportunities/$id")({
  head: ({ loaderData }) => ({
    meta: [
      { title: `${(loaderData as unknown as { title?: string } | undefined)?.title ?? "Opportunity"} — Groundwork` },
    ],
  }),
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(oppOpts(params.id));
    if (!data) throw notFound();
    return data;
  },
  component: OppDetail,
});

function OppDetail() {
  const { id } = Route.useParams();
  const { data: row } = useSuspenseQuery(oppOpts(id));
  const opp = row as any;
  const org = opp.organisations;
  const status = deriveStatus(opp.opens_at, opp.deadline_at);
  const deadline = opp.deadline_at ? new Date(opp.deadline_at) : null;
  const qc = useQueryClient();

  const { signedIn, requireAuth } = useAuthGate();
  const savedQ = useQuery({ queryKey: ["my-saved"], queryFn: () => listMySaved(), enabled: signedIn });
  const isSaved = !!savedQ.data?.some((s: any) => s.opportunity_id === opp.id);
  const toggle = useServerFn(toggleSave);
  const saveMut = useMutation({
    mutationFn: () => toggle({ data: { opportunity_id: opp.id } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["my-saved"] });
      toast(r.saved ? "Saved." : "Unsaved.");
    },
  });

  return (
    <AppShell>
      <Link to="/feed" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to feed
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <span>{categoryLabel[opp.category]}</span>
            {org && (
              <>
                <span>·</span>
                <Link
                  to="/organisations/$slug"
                  params={{ slug: org.slug }}
                  className="hover:text-foreground"
                >
                  {org.name}
                </Link>
              </>
            )}
          </div>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl">{opp.title}</h1>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <a
          href={safeExternalHref(opp.apply_url)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Apply <ExternalLink className="size-4" />
        </a>
        <button
          onClick={() => {
            if (!requireAuth("save an opportunity")) return;
            saveMut.mutate();
          }}
          className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted"
        >
          <Bookmark className={`size-4 ${isSaved ? "fill-primary text-primary" : ""}`} />
          {isSaved ? "Saved" : "Save"}
        </button>
      </div>

      <p className="mt-6 text-sm text-foreground">{deadlineCopy(deadline)}</p>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <h2 className="font-display text-xl">About</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {opp.description}
          </p>

          {opp.eligibility_summary && (
            <>
              <h2 className="mt-8 font-display text-xl">Who can apply</h2>
              <p className="mt-3 text-sm leading-relaxed text-foreground">
                {opp.eligibility_summary}
              </p>
            </>
          )}
        </div>

        <aside className="space-y-4 rounded-lg border border-border bg-card p-5 text-sm">
          <Field label="Location" value={opp.location ?? "—"} />
          <Field label="Remote" value={opp.remote ? "Yes" : "No"} />
          {opp.fields?.length > 0 && <Field label="Fields" value={opp.fields.join(", ")} />}
          {opp.opens_at && (
            <Field label="Opens" value={new Date(opp.opens_at).toLocaleDateString()} />
          )}
          {deadline && (
            <Field label="Deadline" value={deadline.toLocaleDateString()} />
          )}

          <div className="border-t border-border pt-4">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
              <div>
                <p className="font-medium text-foreground">Verified source</p>
                <p className="mt-1">
                  {opp.source_type === "direct"
                    ? "Submitted directly by the organisation."
                    : opp.source_type === "official_page"
                    ? "Sourced from the organisation's official page."
                    : "Sourced via an aggregator."}
                </p>
                <p className="mt-1">
                  Last verified {new Date(opp.last_verified_at).toLocaleDateString()}.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-foreground">{value}</p>
    </div>
  );
}
