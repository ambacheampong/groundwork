import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const listCommunities = createServerFn({ method: "GET" })
  .handler(async () => {
    const supabase = publicClient();
    const { data, error } = await supabase
      .from("communities")
      .select("*")
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getCommunity = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: c, error } = await supabase
      .from("communities")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return c;
  });

export const listFeed = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ communitySlug: z.string().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const supabase = publicClient();
    let q = supabase
      .from("posts")
      .select("*, communities(slug, name, kind), post_votes(vote), post_comments(id)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data.communitySlug) {
      const { data: c } = await supabase
        .from("communities")
        .select("id")
        .eq("slug", data.communitySlug)
        .maybeSingle();
      if (c) q = q.eq("community_id", (c as { id: string }).id);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []).map((p: any) => ({
      ...p,
      score: (p.post_votes ?? []).reduce((s: number, v: any) => s + (v.vote ?? 0), 0),
      comment_count: (p.post_comments ?? []).length,
    }));
  });

export const getPost = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: post, error } = await supabase
      .from("posts")
      .select("*, communities(slug, name), post_votes(vote)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!post) return null;
    const { data: comments } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", data.id)
      .order("created_at");
    const score = ((post as any).post_votes ?? []).reduce((s: number, v: any) => s + (v.vote ?? 0), 0);
    return { post: { ...post, score }, comments: comments ?? [] };
  });

export const createPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        community_id: z.string().uuid(),
        kind: z.enum(["post", "repost", "quote"]).default("post"),
        parent_post_id: z.string().uuid().optional().nullable(),
        title: z.string().trim().max(200).optional().nullable(),
        body: z.string().trim().max(10000).optional().nullable(),
        link_url: z.string().url().optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("posts")
      .insert({ ...data, author_id: context.userId })
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const addComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        post_id: z.string().uuid(),
        body: z.string().trim().min(1).max(5000),
        parent_comment_id: z.string().uuid().optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("post_comments")
      .insert({ ...data, author_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const votePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ post_id: z.string().uuid(), vote: z.union([z.literal(1), z.literal(-1), z.literal(0)]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    if (data.vote === 0) {
      const { error } = await context.supabase
        .from("post_votes")
        .delete()
        .eq("post_id", data.post_id)
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("post_votes")
        .upsert(
          { post_id: data.post_id, user_id: context.userId, vote: data.vote },
          { onConflict: "post_id,user_id" },
        );
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const toggleCommunityMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ community_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("community_members")
      .select("community_id")
      .eq("community_id", data.community_id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing) {
      const { error } = await context.supabase
        .from("community_members")
        .delete()
        .eq("community_id", data.community_id)
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
      return { joined: false };
    }
    const { error } = await context.supabase
      .from("community_members")
      .insert({ community_id: data.community_id, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { joined: true };
  });
