import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { buildGreeting, welcomeBody } from "@/lib/greetings";

export const PRIVACY_POLICY_VERSION = "2026-01";

export const acceptPrivacyConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ language: z.string().default("en") }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("profiles")
      .select("privacy_consent_at, display_name, first_name")
      .eq("id", context.userId)
      .maybeSingle();

    const alreadyConsented = Boolean(
      (existing as { privacy_consent_at?: string | null } | null)?.privacy_consent_at,
    );

    const { error } = await context.supabase
      .from("profiles")
      .upsert(
        {
          id: context.userId,
          privacy_consent_at: new Date().toISOString(),
          privacy_consent_version: PRIVACY_POLICY_VERSION,
          app_language: data.language,
          last_active_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
    if (error) throw new Error(error.message);

    if (!alreadyConsented) {
      const name =
        (existing as { first_name?: string | null; display_name?: string | null } | null)
          ?.first_name ??
        (existing as { display_name?: string | null } | null)?.display_name ??
        null;
      const greeting = buildGreeting({ language: data.language, name });
      await context.supabase.from("notifications").insert({
        user_id: context.userId,
        kind: "system",
        title: greeting.title,
        body: welcomeBody(data.language),
        link: "/feed",
      });
    }

    return { ok: true };
  });

export const touchActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase
      .from("profiles")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", context.userId);
    return { ok: true };
  });
