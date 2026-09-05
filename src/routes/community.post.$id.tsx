import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuthGate } from "@/hooks/use-auth-gate";
import { AppShell } from "@/components/AppShell";
import { getPost, addComment, votePost, createPost } from "@/lib/communities.functions";
import { ArrowBigUp, ArrowBigDown, Repeat2, Quote } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const pOpts = (id: string) => queryOptions({ queryKey: ["post", id], queryFn: () => getPost({ data: { id } }) });

export const Route = createFileRoute("/community/post/$id")({
  head: () => ({ meta: [{ title: "Post — Groundwork" }] }),
  loader: async ({ context, params }) => {
    const r = await context.queryClient.ensureQueryData(pOpts(params.id));
    if (!r) throw notFound();
  },
  component: PostPage,
  errorComponent: ({ error }) => (
    <AppShell><p className="text-sm text-destructive">{error.message}</p></AppShell>
  ),
  notFoundComponent: () => <AppShell><p>Post not found.</p></AppShell>,
});

function PostPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(pOpts(id));
  const post = (data as any).post;
  const comments = (data as any).comments as any[];
  const qc = useQueryClient();

  const { requireAuth } = useAuthGate();
  const commentFn = useServerFn(addComment);
  const voteFn = useServerFn(votePost);
  const repostFn = useServerFn(createPost);

  const [text, setText] = useState("");
  const [quoteText, setQuoteText] = useState("");

  const comment = useMutation({
    mutationFn: () => commentFn({ data: { post_id: id, body: text.trim() } }),
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["post", id] });
      toast.success("Commented.");
    },
  });
  const vote = useMutation({
    mutationFn: (v: 1 | -1) => voteFn({ data: { post_id: id, vote: v } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["post", id] }),
  });
  const repost = useMutation({
    mutationFn: () =>
      repostFn({
        data: {
          community_id: post.community_id,
          kind: "repost",
          parent_post_id: id,
          title: post.title,
          body: post.body,
        },
      }),
    onSuccess: () => {
      toast.success("Reposted to community.");
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
  const quote = useMutation({
    mutationFn: () =>
      repostFn({
        data: {
          community_id: post.community_id,
          kind: "quote",
          parent_post_id: id,
          body: quoteText.trim(),
        },
      }),
    onSuccess: () => {
      setQuoteText("");
      toast.success("Quoted.");
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  return (
    <AppShell>
      <Link to="/community/$slug" params={{ slug: post.communities?.slug ?? "" }} className="text-sm text-muted-foreground hover:text-foreground">
        ← {post.communities?.name}
      </Link>

      <article className="mt-3 rounded-2xl border border-border bg-card p-5">
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <button onClick={() => requireAuth("vote") && vote.mutate(1)} aria-label="Upvote"><ArrowBigUp className="size-6 hover:text-primary" /></button>
            <span className="text-sm font-semibold text-foreground">{post.score}</span>
            <button onClick={() => requireAuth("vote") && vote.mutate(-1)} aria-label="Downvote"><ArrowBigDown className="size-6 hover:text-destructive" /></button>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
            {post.title && <h1 className="mt-1 font-display text-2xl sm:text-3xl">{post.title}</h1>}
            {post.body && <p className="mt-3 whitespace-pre-wrap text-sm">{post.body}</p>}
            {post.link_url && <a href={post.link_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-primary hover:underline">{post.link_url}</a>}

            <div className="mt-4 flex gap-2">
              <button onClick={() => requireAuth("repost") && repost.mutate()} className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-1.5 text-xs hover:bg-muted">
                <Repeat2 className="size-3.5" /> Repost
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-background p-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Quote className="size-3.5" /> Quote with comment
              </div>
              <textarea
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                rows={2}
                placeholder="Add your take…"
                className="mt-1 w-full resize-none rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
              />
              <div className="mt-2 flex justify-end">
                <button
                  disabled={!quoteText.trim()}
                  onClick={() => requireAuth("quote a post") && quote.mutate()}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
                >
                  Post quote
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>

      <section className="mt-6">
        <h2 className="font-display text-xl">Comments</h2>
        <div className="mt-3 rounded-2xl border border-border bg-card p-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment"
            rows={2}
            maxLength={5000}
            className="w-full resize-none rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
          />
          <div className="mt-2 flex justify-end">
            <button
              disabled={!text.trim() || comment.isPending}
              onClick={() => requireAuth("comment") && comment.mutate()}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              Comment
            </button>
          </div>
        </div>
        <ul className="mt-3 space-y-2">
          {comments.length === 0 && (
            <li className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No comments yet.
            </li>
          )}
          {comments.map((c) => (
            <li key={c.id} className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{c.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
