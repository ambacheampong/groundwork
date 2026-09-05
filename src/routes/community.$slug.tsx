import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuthGate } from "@/hooks/use-auth-gate";
import { AppShell } from "@/components/AppShell";
import {
  getCommunity,
  listFeed,
  createPost,
  votePost,
  toggleCommunityMembership,
} from "@/lib/communities.functions";
import { ArrowBigUp, ArrowBigDown, MessageSquare, Repeat2, Quote } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const cOpts = (slug: string) => queryOptions({ queryKey: ["community", slug], queryFn: () => getCommunity({ data: { slug } }) });
const fOpts = (slug: string) => queryOptions({ queryKey: ["feed", slug], queryFn: () => listFeed({ data: { communitySlug: slug } }) });

export const Route = createFileRoute("/community/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${params.slug} — Community` }] }),
  loader: async ({ context, params }) => {
    const c = await context.queryClient.ensureQueryData(cOpts(params.slug));
    if (!c) throw notFound();
    await context.queryClient.ensureQueryData(fOpts(params.slug));
  },
  component: CommunityPage,
  errorComponent: ({ error }) => (
    <AppShell><p className="text-sm text-destructive">{error.message}</p></AppShell>
  ),
  notFoundComponent: () => <AppShell><p>Community not found.</p></AppShell>,
});

function CommunityPage() {
  const { slug } = Route.useParams();
  const { data: community } = useSuspenseQuery(cOpts(slug));
  const { data: posts = [] } = useSuspenseQuery(fOpts(slug));
  const qc = useQueryClient();

  const { requireAuth } = useAuthGate();
  const createFn = useServerFn(createPost);
  const voteFn = useServerFn(votePost);
  const joinFn = useServerFn(toggleCommunityMembership);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const create = useMutation({
    mutationFn: () =>
      createFn({ data: { community_id: (community as any).id, title: title.trim() || null, body: body.trim() || null } }),
    onSuccess: () => {
      setTitle(""); setBody("");
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Posted.");
    },
  });

  const vote = useMutation({
    mutationFn: (v: { id: string; vote: 1 | -1 }) => voteFn({ data: { post_id: v.id, vote: v.vote } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });

  const join = useMutation({
    mutationFn: () => joinFn({ data: { community_id: (community as any).id } }),
    onSuccess: (r: any) => toast.success(r?.joined ? "Joined." : "Left."),
  });

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{(community as any).kind}</p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl md:text-4xl">{(community as any).name}</h1>
          {(community as any).description && (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{(community as any).description}</p>
          )}
        </div>
        <button
          onClick={() => requireAuth("join a community") && join.mutate()}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Join
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          maxLength={200}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share something with the community"
          rows={3}
          maxLength={10000}
          className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={() => requireAuth("post") && create.mutate()}
            disabled={(!title.trim() && !body.trim()) || create.isPending}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Post
          </button>
        </div>
      </div>

      <ul className="mt-6 space-y-3">
        {posts.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            Nothing here yet. Kick things off.
          </li>
        )}
        {posts.map((p: any) => (
          <li key={p.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex gap-3">
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <button onClick={() => requireAuth("vote") && vote.mutate({ id: p.id, vote: 1 })} aria-label="Upvote">
                  <ArrowBigUp className="size-5 hover:text-primary" />
                </button>
                <span className="text-xs font-semibold text-foreground">{p.score}</span>
                <button onClick={() => requireAuth("vote") && vote.mutate({ id: p.id, vote: -1 })} aria-label="Downvote">
                  <ArrowBigDown className="size-5 hover:text-destructive" />
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {p.kind === "repost" && <Repeat2 className="size-3.5" />}
                  {p.kind === "quote" && <Quote className="size-3.5" />}
                  <span>{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                </div>
                <Link to="/community/post/$id" params={{ id: p.id }}>
                  {p.title && <h3 className="font-display text-xl hover:text-primary">{p.title}</h3>}
                  {p.body && <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{p.body}</p>}
                </Link>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <Link to="/community/post/$id" params={{ id: p.id }} className="inline-flex items-center gap-1 hover:text-foreground">
                    <MessageSquare className="size-3.5" /> {p.comment_count}
                  </Link>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
