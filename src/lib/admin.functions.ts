import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const [{ data, error }, { data: sup }] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    context.supabase.rpc("is_super_admin", { _user_id: context.userId }),
  ]);
  if (error) throw new Error(error.message);
  if (!data && !sup) throw new Error("Forbidden");
}

export const isCurrentUserAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data }, { data: sup }] = await Promise.all([
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
      context.supabase.rpc("is_super_admin", { _user_id: context.userId }),
    ]);
    return { admin: Boolean(data) || Boolean(sup), superAdmin: Boolean(sup) };
  });

export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [oppsCount, orgsCount, postsCount, commentsCount, runsCount, oppsAll, runsRecent, signupsRes, orgViewsRes, communitiesRes, postsPerCommunity] =
      await Promise.all([
        context.supabase.from("opportunities").select("id", { count: "exact", head: true }),
        context.supabase.from("organisations").select("id", { count: "exact", head: true }),
        context.supabase.from("posts").select("id", { count: "exact", head: true }),
        context.supabase.from("post_comments").select("id", { count: "exact", head: true }),
        context.supabase.from("ingestion_runs").select("id", { count: "exact", head: true }).gte("started_at", new Date(Date.now() - 7 * 864e5).toISOString()),
        context.supabase.from("opportunities").select("study_level, funding_type, deadline_at, hidden_at"),
        context.supabase.from("ingestion_runs").select("id, started_at, opportunities_added, status").order("started_at", { ascending: false }).limit(20),
        supabaseAdmin.rpc("get_admin_signups_by_day", { _days: 30 }),
        supabaseAdmin.rpc("get_org_view_counts"),
        context.supabase.from("communities").select("id, name, slug"),
        context.supabase.from("posts").select("community_id"),
      ]);

    const byLevel: Record<string, number> = {};
    const byFunding: Record<string, number> = {};
    let closingThisWeek = 0;
    const weekAhead = Date.now() + 7 * 864e5;
    for (const o of ((oppsAll.data ?? []) as any[])) {
      if (o.hidden_at) continue;
      const l = o.study_level ?? "unspecified";
      byLevel[l] = (byLevel[l] ?? 0) + 1;
      const f = o.funding_type ?? "unspecified";
      byFunding[f] = (byFunding[f] ?? 0) + 1;
      if (o.deadline && new Date(o.deadline).getTime() < weekAhead && new Date(o.deadline).getTime() > Date.now()) closingThisWeek++;
    }

    const commMap = new Map<string, string>();
    for (const c of (communitiesRes.data ?? [])) commMap.set(c.id, c.name);
    const postsByComm: Record<string, number> = {};
    for (const p of (postsPerCommunity.data ?? [])) {
      const name = commMap.get(p.community_id) ?? "unknown";
      postsByComm[name] = (postsByComm[name] ?? 0) + 1;
    }

    // top orgs by views
    const orgViews = (orgViewsRes.data ?? []).slice().sort((a: any, b: any) => Number(b.view_count) - Number(a.view_count)).slice(0, 10);
    const orgIds = orgViews.map((v: any) => v.org_id);
    let topOrgs: { name: string; views: number }[] = [];
    if (orgIds.length) {
      const { data: orgs } = await context.supabase.from("organisations").select("id, name").in("id", orgIds);
      const nameMap = new Map((orgs ?? []).map((o: any) => [o.id, o.name]));
      topOrgs = orgViews.map((v: any) => ({ name: (nameMap.get(v.org_id) as string) ?? "—", views: Number(v.view_count) }));
    }

    return {
      kpis: {
        opportunities: oppsCount.count ?? 0,
        organisations: orgsCount.count ?? 0,
        posts: postsCount.count ?? 0,
        comments: commentsCount.count ?? 0,
        runsLast7d: runsCount.count ?? 0,
        closingThisWeek,
      },
      byLevel: Object.entries(byLevel).map(([k, v]) => ({ name: k, count: v })),
      byFunding: Object.entries(byFunding).map(([k, v]) => ({ name: k, count: v })),
      runs: (runsRecent.data ?? []).slice().reverse().map((r: any) => ({
        id: r.id,
        when: new Date(r.started_at).toLocaleDateString(),
        added: r.opportunities_added ?? 0,
        status: r.status,
      })),
      signups: (signupsRes.data ?? []).map((r: any) => ({ day: r.day, count: Number(r.count) })),
      topOrgs,
      postsByCommunity: Object.entries(postsByComm).map(([name, count]) => ({ name, count })),
    };
  });

// Opportunities admin
export const adminListOpportunities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ search: z.string().optional() }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("opportunities")
      .select("*, organisations(name, slug)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (data.search) q = q.ilike("title", `%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminUpdateOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        patch: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          study_level: z.enum(["undergraduate", "masters", "phd", "fellowship", "job", "other"]).nullable().optional(),
          funding_type: z.string().optional().nullable(),
          deadline_at: z.string().optional().nullable(),
          featured: z.boolean().optional(),
          hidden_at: z.string().nullable().optional(),
        }),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("opportunities").update(data.patch as any).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("opportunities").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Organisations
export const adminListOrganisations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: rows, error }, { data: views }] = await Promise.all([
      context.supabase.from("organisations").select("*").order("name"),
      supabaseAdmin.rpc("get_org_view_counts"),
    ]);
    if (error) throw new Error(error.message);
    const viewMap = new Map((views ?? []).map((v: any) => [v.org_id, Number(v.view_count)]));
    return (rows ?? []).map((r: any) => ({ ...r, views: viewMap.get(r.id) ?? 0 }));
  });

export const adminUpdateOrganisation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid(),
      patch: z.object({
        name: z.string().optional(),
        description: z.string().optional().nullable(),
        website: z.string().optional().nullable(),
        verified: z.boolean().optional(),
      }),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("organisations").update(data.patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteOrganisation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("organisations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Users (needs admin client for auth.users)
export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: authList, error: authErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (authErr) throw new Error(authErr.message);
    const ids = authList.users.map((u) => u.id);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").in("id", ids),
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids),
    ]);
    const profMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const roleMap = new Map<string, string[]>();
    for (const r of (roles ?? []) as any[]) {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    }
    return authList.users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      created_at: u.created_at,
      confirmed: Boolean(u.email_confirmed_at),
      profile: profMap.get(u.id) ?? null,
      roles: roleMap.get(u.id) ?? [],
    }));
  });

export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      user_id: z.string().uuid(),
      role: z.enum(["admin", "moderator", "user"]),
      grant: z.boolean(),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      const { error } = await supabaseAdmin.from("user_roles").upsert({ user_id: data.user_id, role: data.role as any }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id).eq("role", data.role as any);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminSoftDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ user_id: z.string().uuid(), restore: z.boolean().optional() }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ deleted_at: data.restore ? null : new Date().toISOString(), banned_at: data.restore ? null : new Date().toISOString() })
      .eq("id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Community moderation
export const adminListPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("posts")
      .select("*, communities(name, slug), profiles!posts_author_id_fkey(display_name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminHidePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), hide: z.boolean() }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("posts")
      .update({ hidden_at: data.hide ? new Date().toISOString() : null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Ingestion runs log
export const adminListIngestionRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("ingestion_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// Allowlist
export const adminListAllowlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase.from("admin_email_allowlist").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminAddAllowlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ email: z.string().email() }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("admin_email_allowlist").insert({ email: data.email.toLowerCase() });
    if (error) throw new Error(error.message);
    // Also promote any existing verified user with that email right now
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const match = list.users.find((u) => (u.email ?? "").toLowerCase() === data.email.toLowerCase());
    if (match) {
      await supabaseAdmin.from("user_roles").upsert({ user_id: match.id, role: "admin" as any }, { onConflict: "user_id,role" });
    }
    return { ok: true };
  });

export const adminRemoveAllowlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ email: z.string().email() }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("admin_email_allowlist").delete().eq("email", data.email.toLowerCase());
    if (error) throw new Error(error.message);
    return { ok: true };
  });
