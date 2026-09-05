import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const prefsSchema = z.object({
  deadlineAlerts: z.boolean(),
  weeklyDigest: z.boolean(),
  productEmails: z.boolean(),
  emailFrequency: z.enum(["instant", "daily", "weekly", "off"]),
  language: z.string().max(8),
  reducedMotion: z.boolean(),
  compact: z.boolean(),
  defaultLanding: z.enum(["/feed", "/saved", "/organisations"]),
  profileVisibility: z.enum(["public", "private"]),
  showActivity: z.boolean(),
});

export type ServerPrefs = z.infer<typeof prefsSchema>;

export const getMyPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("preferences, privacy_consent_at")
      .eq("id", context.userId)
      .maybeSingle();
    return {
      preferences: ((data as any)?.preferences ?? {}) as Partial<ServerPrefs>,
      privacy_consent_at: ((data as any)?.privacy_consent_at ?? null) as string | null,
    };
  });

export const saveMyPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => prefsSchema.partial().parse(i))
  .handler(async ({ context, data }) => {
    const { data: current } = await context.supabase
      .from("profiles")
      .select("preferences")
      .eq("id", context.userId)
      .maybeSingle();
    const merged = { ...(((current as any)?.preferences ?? {}) as object), ...data };
    const { error } = await context.supabase
      .from("profiles")
      .update({ preferences: merged } as any)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true, preferences: merged as Partial<ServerPrefs> };
  });

/** Everything the account holds, as a JSON export the user can download. */
export const exportMyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [profile, saved, tracked, notifications] = await Promise.all([
      context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
      context.supabase.from("saved_opportunities").select("*"),
      context.supabase.from("tracked_organisations").select("*"),
      context.supabase.from("notifications").select("*").limit(500),
    ]);
    return {
      exported_at: new Date().toISOString(),
      profile: profile.data ?? null,
      saved_opportunities: saved.data ?? [],
      tracked_organisations: tracked.data ?? [],
      notifications: notifications.data ?? [],
    };
  });
