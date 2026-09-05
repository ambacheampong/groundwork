import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const listOpportunities = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        category: z.string().optional(),
        level: z.string().optional(),
        q: z.string().optional(),
        location: z.string().optional(),
        work_mode: z.string().optional(),
        salary_min: z.number().nullable().optional(),
        salary_max: z.number().nullable().optional(),
        status: z.enum(["all", "open", "closed"]).default("all"),
        sort: z.enum(["newest", "deadline", "salary"]).default("deadline"),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const supabase = publicClient();
    let query = supabase
      .from("opportunities")
      .select("*, organisations(id, slug, name, type, logo_url)")
      .is("hidden_at", null);

    if (data.category && data.category !== "all") query = query.eq("category", data.category);
    if (data.level && data.level !== "all") query = query.eq("study_level", data.level);
    if (data.q) query = query.or(`title.ilike.%${data.q}%,location.ilike.%${data.q}%`);
    if (data.location) query = query.ilike("location", `%${data.location}%`);
    if (data.work_mode && data.work_mode !== "all") query = query.eq("work_mode", data.work_mode);
    if (typeof data.salary_min === "number") query = query.gte("salary_max", data.salary_min);
    if (typeof data.salary_max === "number") query = query.lte("salary_min", data.salary_max);
    if (data.status === "open")
      query = query.or(`deadline_at.is.null,deadline_at.gte.${new Date().toISOString()}`);
    if (data.status === "closed") query = query.lt("deadline_at", new Date().toISOString());

    if (data.sort === "newest") query = query.order("created_at", { ascending: false });
    else if (data.sort === "salary")
      query = query.order("salary_max", { ascending: false, nullsFirst: false });
    else query = query.order("deadline_at", { ascending: true, nullsFirst: false });


    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });


export const getOpportunity = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: row, error } = await supabase
      .from("opportunities")
      .select("*, organisations(*)")
      .is("hidden_at", null)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const listOrganisations = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ q: z.string().optional() }).parse(input ?? {}))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    let query = supabase.from("organisations").select("*").order("name");
    if (data.q) query = query.ilike("name", `%${data.q}%`);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getOrganisation = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: org, error } = await supabase
      .from("organisations")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!org) return null;
    const { data: opps } = await supabase
      .from("opportunities")
      .select("*")
      .eq("org_id", (org as { id: string }).id)
      .order("deadline_at", { ascending: true, nullsFirst: false });
    return { org, opportunities: opps ?? [] };
  });
