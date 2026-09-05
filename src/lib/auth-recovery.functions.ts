import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Tiered password recovery.
 * Regular users get a self-service reset link. Organisation and admin accounts
 * cannot self-reset — only a super admin can trigger their recovery.
 * The response is deliberately generic so it can't be used to enumerate accounts.
 */
export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        origin: z.string().url().max(300),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();

    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = list?.users.find((u) => (u.email ?? "").toLowerCase() === email);

    if (user) {
      const { data: roles } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const list2 = ((roles ?? []) as { role: string }[]).map((r) => r.role);
      const gated = list2.some((r) => r === "org" || r === "admin" || r === "super_admin");

      if (!gated) {
        await supabaseAdmin.auth.resetPasswordForEmail(email, {
          redirectTo: `${data.origin}/reset-password`,
        });
      }
    }

    return { ok: true };
  });

/** Resend the confirmation email for an unverified account. */
export const resendVerificationEmail = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({ email: z.string().trim().email().max(255), origin: z.string().url().max(300) })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"]!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    await client.auth.resend({
      type: "signup",
      email: data.email.toLowerCase(),
      options: { emailRedirectTo: `${data.origin}/auth` },
    });
    return { ok: true };
  });
