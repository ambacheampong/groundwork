import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        title: z.string().optional().nullable(),
        display_name: z.string().optional().nullable(),
        first_name: z.string().optional().nullable(),
        last_name: z.string().optional().nullable(),
        date_of_birth: z.string().optional().nullable(),
        gender: z.string().optional().nullable(),
        bio: z.string().max(500).optional().nullable(),
        country: z.string().optional().nullable(),
        education_level: z
          .enum(["secondary", "undergraduate", "graduate", "postgraduate", "professional"])
          .optional()
          .nullable(),
        institution: z.string().optional().nullable(),
        field_of_study: z.string().optional().nullable(),
        skills: z.array(z.string()).optional(),
        fields_of_interest: z.array(z.string()).optional(),
        avatar_path: z.string().optional().nullable(),
        banner_path: z.string().optional().nullable(),
        app_language: z.string().optional(),
        onboarded: z.boolean().optional(),

      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const payload = { id: context.userId, ...data };
    const { error } = await context.supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const softDeleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMySaved = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("saved_opportunities")
      .select("opportunity_id, opportunities(*, organisations(id, slug, name, logo_url))")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listMyTracked = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("tracked_organisations")
      .select("org_id, organisations(*)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const toggleSave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ opportunity_id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: existing } = await context.supabase
      .from("saved_opportunities")
      .select("opportunity_id")
      .eq("user_id", context.userId)
      .eq("opportunity_id", data.opportunity_id)
      .maybeSingle();
    if (existing) {
      await context.supabase
        .from("saved_opportunities")
        .delete()
        .eq("user_id", context.userId)
        .eq("opportunity_id", data.opportunity_id);
      return { saved: false };
    }
    await context.supabase
      .from("saved_opportunities")
      .insert({ user_id: context.userId, opportunity_id: data.opportunity_id });
    return { saved: true };
  });

export const toggleTrack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ org_id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: existing } = await context.supabase
      .from("tracked_organisations")
      .select("org_id")
      .eq("user_id", context.userId)
      .eq("org_id", data.org_id)
      .maybeSingle();
    if (existing) {
      await context.supabase
        .from("tracked_organisations")
        .delete()
        .eq("user_id", context.userId)
        .eq("org_id", data.org_id);
      return { tracked: false };
    }
    await context.supabase
      .from("tracked_organisations")
      .insert({ user_id: context.userId, org_id: data.org_id });
    return { tracked: true };
  });
