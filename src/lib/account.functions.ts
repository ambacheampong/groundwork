import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AccountRole = "user" | "org" | "admin" | "super_admin";

/** Role + gating state for the signed-in account. Role lives in the DB, never the client. */
export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: roles }, { data: profile }, { data: app }] = await Promise.all([
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
      context.supabase
        .from("profiles")
        .select("display_name, must_change_password, last_login_at, banned_at, deleted_at")
        .eq("id", context.userId)
        .maybeSingle(),
      context.supabase
        .from("org_applications")
        .select("id, org_name, org_type, status, review_note, document_path, org_id, created_at")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const list = ((roles ?? []) as { role: string }[]).map((r) => r.role);
    const role: AccountRole = list.includes("super_admin")
      ? "super_admin"
      : list.includes("admin")
        ? "admin"
        : list.includes("org")
          ? "org"
          : "user";

    return {
      userId: context.userId,
      role,
      roles: list,
      display_name: (profile as any)?.display_name ?? null,
      must_change_password: Boolean((profile as any)?.must_change_password),
      suspended: Boolean((profile as any)?.banned_at || (profile as any)?.deleted_at),
      last_login_at: (profile as any)?.last_login_at ?? null,
      orgApplication: (app as any) ?? null,
    };
  });

export const recordLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase
      .from("profiles")
      .update({ last_login_at: new Date().toISOString() } as any)
      .eq("id", context.userId);
    return { ok: true };
  });

/** Called after supabase.auth.updateUser({ password }) succeeds on the client. */
export const clearForcedPasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ must_change_password: false } as any)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const submitOrgApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        org_name: z.string().trim().min(2).max(120),
        org_type: z.enum(["company", "ngo", "government", "academic", "foundation"]),
        official_email: z.string().trim().email().max(255),
        website: z.string().trim().max(255).optional().nullable(),
        document_path: z.string().max(400).optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("org_applications").insert({
      user_id: context.userId,
      org_name: data.org_name,
      org_type: data.org_type,
      official_email: data.official_email.toLowerCase(),
      website: data.website ?? null,
      document_path: data.document_path ?? null,
    } as any);
    if (error) throw new Error(error.message);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: context.userId, role: "org" as any }, { onConflict: "user_id,role" });
    await supabaseAdmin
      .from("profiles")
      .update({ display_name: data.org_name } as any)
      .eq("id", context.userId);

    return { ok: true, status: "pending" as const };
  });

/** Single-use, expiring invite codes. Redeemed by the signed-in account that was just created. */
export const redeemInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ code: z.string().trim().min(6).max(64) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = data.code.trim().toUpperCase();

    const { data: invite } = await supabaseAdmin
      .from("account_invites")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (!invite) throw new Error("That invite code isn't valid.");
    if ((invite as any).used_at) throw new Error("That invite code has already been used.");
    if ((invite as any).revoked_at) throw new Error("That invite code was revoked.");
    if ((invite as any).status === "pending")
      throw new Error("That invite code is still waiting for super admin approval.");
    if ((invite as any).status !== "approved") throw new Error("That invite code isn't valid.");
    if (new Date((invite as any).expires_at).getTime() < Date.now())
      throw new Error("That invite code has expired.");

    const claimEmail = (invite as any).email as string | null;
    if (claimEmail) {
      const email = (context.claims as any)?.email as string | undefined;
      if (!email || email.toLowerCase() !== claimEmail.toLowerCase())
        throw new Error("That invite code was issued to a different email address.");
    }

    // Single-use: only the first claimant wins the row.
    const { data: claimed } = await supabaseAdmin
      .from("account_invites")
      .update({ used_at: new Date().toISOString(), used_by: context.userId } as any)
      .eq("id", (invite as any).id)
      .is("used_at", null)
      .select("id, role")
      .maybeSingle();

    if (!claimed) throw new Error("That invite code has already been used.");

    const role = (claimed as any).role as AccountRole;
    if (role !== "user") {
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: context.userId, role: role as any }, { onConflict: "user_id,role" });
    }

    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: (invite as any).created_by,
      action: "invite.redeemed",
      target_type: "user",
      target_id: context.userId,
      meta: { code, role },
    } as any);

    return { ok: true, role };
  });

/**
 * A short reference code tied to the account (NOT derived from the password).
 * Shown in full once to its owner; a super admin only ever sees it masked.
 */
export const getOrCreateRecoveryReference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("recovery_hint")
      .eq("id", context.userId)
      .maybeSingle();

    let hint = (prof as any)?.recovery_hint as string | null;
    if (!hint) {
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const bytes = crypto.getRandomValues(new Uint8Array(12));
      const raw = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
      hint = `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
      await supabaseAdmin
        .from("profiles")
        .update({ recovery_hint: hint, recovery_hint_set_at: new Date().toISOString() } as any)
        .eq("id", context.userId);
    }
    return { recovery_reference: hint };
  });
