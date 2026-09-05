import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** The organisation workspace: application state, linked org record, postings and reach. */
export const getMyOrgSpace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: app } = await context.supabase
      .from("org_applications")
      .select("id, org_name, org_type, status, review_note, document_path, org_id, official_email, website, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const orgId = (app as any)?.org_id as string | null | undefined;
    if (!orgId) return { application: app ?? null, org: null, opportunities: [], views: 0 };

    const [{ data: org }, { data: opps }, { data: counts }] = await Promise.all([
      context.supabase.from("organisations").select("*").eq("id", orgId).maybeSingle(),
      context.supabase
        .from("opportunities")
        .select("id, title, category, deadline_at, location, hidden_at, created_at, apply_url")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false }),
      context.supabase.rpc("get_org_view_counts" as any, { org_ids: [orgId] } as any),
    ]);

    const views = Array.isArray(counts)
      ? Number((counts as any[])[0]?.views ?? (counts as any[])[0]?.view_count ?? 0)
      : 0;

    return {
      application: app ?? null,
      org: org ?? null,
      opportunities: (opps ?? []) as any[],
      views,
    };
  });

const postingSchema = z.object({
  title: z.string().trim().min(4).max(180),
  category: z.enum([
    "scholarship",
    "postgraduate",
    "fellowship",
    "internship",
    "job",
    "freelance",
    "programme",
  ]),
  description: z.string().trim().min(20).max(6000),
  apply_url: z.string().trim().url().max(600),
  location: z.string().trim().max(160).optional().nullable(),
  deadline_at: z.string().trim().max(40).optional().nullable(),
  eligibility_summary: z.string().trim().max(2000).optional().nullable(),
  study_level: z
    .enum(["undergraduate", "masters", "phd", "fellowship", "job", "other"])
    .optional()
    .nullable(),
  work_mode: z.enum(["remote", "onsite", "hybrid"]).optional().nullable(),
});

async function requireApprovedOrg(context: any) {
  const { data: app } = await context.supabase
    .from("org_applications")
    .select("status, org_id")
    .eq("user_id", context.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!app || (app as any).status !== "approved" || !(app as any).org_id)
    throw new Error("Your organisation is not verified yet, so posting is not available.");
  return (app as any).org_id as string;
}

export const createOrgOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => postingSchema.parse(i))
  .handler(async ({ context, data }) => {
    const orgId = await requireApprovedOrg(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("opportunities")
      .insert({
        org_id: orgId,
        title: data.title,
        category: data.category as any,
        description: data.description,
        apply_url: data.apply_url,
        location: data.location || null,
        deadline_at: data.deadline_at ? new Date(data.deadline_at).toISOString() : null,
        eligibility_summary: data.eligibility_summary || null,
        study_level: (data.study_level as any) || null,
        work_mode: data.work_mode || null,
        remote: data.work_mode === "remote",
        source_type: "direct" as any,
        source_name: "Organisation post",
      } as any)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { ok: true, id: (row as any)?.id as string };
  });

export const setOrgOpportunityHidden = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), hidden: z.boolean() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const orgId = await requireApprovedOrg(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("opportunities")
      .update({ hidden_at: data.hidden ? new Date().toISOString() : null } as any)
      .eq("id", data.id)
      .eq("org_id", orgId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateMyOrgProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        description: z.string().trim().max(2000).optional().nullable(),
        website: z.string().trim().max(300).optional().nullable(),
        country: z.string().trim().max(120).optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const orgId = await requireApprovedOrg(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("organisations")
      .update({
        description: data.description ?? null,
        website: data.website ?? null,
        country: data.country ?? null,
      } as any)
      .eq("id", orgId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
