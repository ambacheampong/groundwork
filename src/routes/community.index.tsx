import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { listCommunities, listFeed } from "@/lib/communities.functions";
import { Users, MessageSquare, ArrowBigUp, ArrowBigDown, Repeat2, Quote } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const communitiesOpts = queryOptions({ queryKey: ["communities"], queryFn: () => listCommunities() });
const feedOpts = queryOptions({ queryKey: ["feed"], queryFn: () => listFeed({ data: {} }) });

export const Route = createFileRoute("/community/")({
  head: () => ({ meta: [{ title: "Community — Groundwork" }] }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(communitiesOpts),
      context.queryClient.ensureQueryData(feedOpts),
    ]);
  },
  component: CommunityHome,
  errorComponent: ({ error }) => (
    <AppShell><p className="text-sm text-destructive">{error.message}</p></AppShell>
  ),
  notFoundComponent: () => <AppShell><p>Not found.</p></AppShell>,
});

function CommunityHome() {
  const { data: communities = [] } = useSuspenseQuery(communitiesOpts);
  const { data: feed = [] } = useSuspenseQuery(feedOpts);

  return (
    <AppShell>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl">Community</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Discussions, news, and questions from people chasing the same things you are.
          </p>

          <ul className="mt-6 space-y-3">
            {feed.length === 0 && (
              <li className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
                Nothing posted yet. Be the first — pick a community and start a thread.
              </li>
            )}
            {feed.map((p: any) => (
              <li key={p.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {p.kind === "repost" && <Repeat2 className="size-3.5" />}
                  {p.kind === "quote" && <Quote className="size-3.5" />}
                  <Link
                    to="/community/$slug"
                    params={{ slug: p.communities?.slug ?? "" }}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {p.communities?.name}
                  </Link>
                  <span>· {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                </div>
                <Link to="/community/post/$id" params={{ id: p.id }} className="mt-1 block">
                  {p.title && <h3 className="font-display text-xl hover:text-primary">{p.title}</h3>}
                  {p.body && <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{p.body}</p>}
                  {p.link_url && (
                    <span className="mt-2 inline-block truncate text-xs text-primary">{p.link_url}</span>
                  )}
                </Link>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <ArrowBigUp className="size-4" /> {p.score} <ArrowBigDown className="size-4" />
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="size-3.5" /> {p.comment_count}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="font-display text-lg">Communities</h2>
            <ul className="mt-3 space-y-1.5">
              {communities.map((c: any) => (
                <li key={c.id}>
                  <Link
                    to="/community/$slug"
                    params={{ slug: c.slug }}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <Users className="size-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {c.kind}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
