import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ROLES = ["user", "org", "admin", "super_admin"] as const;
const ELEVATED = ["admin", "super_admin"] as const;

async function roleFlags(context: { supabase: any; userId: string }) {
  const [{ data: admin }, { data: superAdmin }] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    context.supabase.rpc("is_super_admin", { _user_id: context.userId }),
  ]);
  return { admin: Boolean(admin) || Boolean(superAdmin), superAdmin: Boolean(superAdmin) };
}

async function assertAdmin(context: { supabase: any; userId: string }) {
  const f = await roleFlags(context);
  if (!f.admin) throw new Error("Forbidden");
  return f;
}

async function assertSuperAdmin(context: { supabase: any; userId: string }) {
  const f = await roleFlags(context);
  if (!f.superAdmin) throw new Error("Forbidden: super admin only.");
  return f;
}

async function audit(
  context: { userId: string; claims: any },
  entry: { action: string; target_type?: string; target_id?: string; meta?: Record<string, unknown> },
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("admin_audit_log").insert({
    actor_id: context.userId,
    actor_email: (context.claims as any)?.email ?? null,
    action: entry.action,
    target_type: entry.target_type ?? null,
    target_id: entry.target_id ?? null,
    meta: entry.meta ?? {},
  } as any);
}

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const raw = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

/** First and last character only; everything between is masked. Never a password. */
function maskHint(value: string | null | undefined) {
  if (!value) return null;
  const v = value.replace(/-/g, "");
  if (v.length < 3) return "*".repeat(v.length);
  return `${v[0]}${"*".repeat(v.length - 2)}${v[v.length - 1]}`;
}

async function targetRoles(user_id: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user_id);
  return ((data ?? []) as { role: string }[]).map((r) => r.role);
}

/* ---------------------------- who am i ---------------------------- */

export const getAdminLevel = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => roleFlags(context));

/* ------------------------------ accounts ------------------------------ */

export const adminListAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const flags = await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: authList, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 500 });
    if (error) throw new Error(error.message);
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
    return authList.users.map((u) => {
      const prof: any = profMap.get(u.id) ?? null;
      const list = roleMap.get(u.id) ?? [];
      const role = list.includes("super_admin")
        ? "super_admin"
        : list.includes("admin")
          ? "admin"
          : list.includes("org")
            ? "org"
            : "user";
      const status = prof?.banned_at || prof?.deleted_at
        ? "suspended"
        : u.email_confirmed_at
          ? "active"
          : "pending";
      return {
        id: u.id,
        email: u.email ?? "",
        display_name: prof?.display_name ?? null,
        role,
        roles: list,
        status,
        email_verified: Boolean(u.email_confirmed_at),
        must_change_password: Boolean(prof?.must_change_password),
        // Masked reference code only. Never a password, never the full value.
        recovery_hint_masked: flags.superAdmin ? maskHint(prof?.recovery_hint) : null,
        last_login_at: u.last_sign_in_at ?? prof?.last_login_at ?? null,
        created_at: u.created_at,
      };
    });
  });

export const adminCreateAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        password: z.string().min(8).max(72),
        role: z.enum(ROLES),
        display_name: z.string().trim().max(120).optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const flags = await assertAdmin(context);
    if ((ELEVATED as readonly string[]).includes(data.role) && !flags.superAdmin)
      throw new Error("Only a super admin can create admin accounts.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email.toLowerCase(),
      password: data.password,
      email_confirm: false,
      user_metadata: { full_name: data.display_name ?? data.email.split("@")[0] },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Could not create the account.");

    const uid = created.user.id;
    const hint = makeCode();
    await supabaseAdmin.from("profiles").upsert(
      {
        id: uid,
        display_name: data.display_name ?? data.email.split("@")[0],
        must_change_password: true,
        recovery_hint: hint,
        recovery_hint_set_at: new Date().toISOString(),
      } as any,
      { onConflict: "id" },
    );
    if (data.role !== "user") {
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: uid, role: data.role as any }, { onConflict: "user_id,role" });
    }

    await audit(context, {
      action: "account.created",
      target_type: "user",
      target_id: uid,
      meta: { email: data.email.toLowerCase(), role: data.role },
    });

    // The reference code is shown once to the creating admin so they can pass it on.
    return { ok: true, id: uid, recovery_reference: hint };
  });

export const adminSetAccountRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ user_id: z.string().uuid(), role: z.enum(ROLES) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const flags = await assertAdmin(context);
    const current = await targetRoles(data.user_id);
    const targetIsElevated = current.some((r) => (ELEVATED as readonly string[]).includes(r));
    if (!flags.superAdmin && (targetIsElevated || (ELEVATED as readonly string[]).includes(data.role)))
      throw new Error("Only a super admin can manage admin accounts.");
    if (data.user_id === context.userId && data.role !== "super_admin")
      throw new Error("You can't demote your own super admin account.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id)
      .in("role", ["admin", "org", "super_admin"] as any);
    if (data.role !== "user") {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.user_id, role: data.role as any }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    }
    await audit(context, {
      action: "account.role_changed",
      target_type: "user",
      target_id: data.user_id,
      meta: { role: data.role },
    });
    return { ok: true };
  });

export const adminSetAccountStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ user_id: z.string().uuid(), suspended: z.boolean() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const flags = await assertAdmin(context);
    if (data.user_id === context.userId) throw new Error("You can't suspend your own account.");
    const current = await targetRoles(data.user_id);
    if (!flags.superAdmin && current.some((r) => (ELEVATED as readonly string[]).includes(r)))
      throw new Error("Only a super admin can manage admin accounts.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const stamp = data.suspended ? new Date().toISOString() : null;
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ banned_at: stamp, deleted_at: stamp } as any)
      .eq("id", data.user_id);
    if (error) throw new Error(error.message);
    await audit(context, {
      action: data.suspended ? "account.suspended" : "account.restored",
      target_type: "user",
      target_id: data.user_id,
    });
    return { ok: true };
  });

export const adminDeleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ user_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const flags = await assertAdmin(context);
    if (data.user_id === context.userId) throw new Error("You can't delete your own account.");
    const current = await targetRoles(data.user_id);
    if (!flags.superAdmin && current.some((r) => (ELEVATED as readonly string[]).includes(r)))
      throw new Error("Only a super admin can delete admin accounts.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    await audit(context, { action: "account.deleted", target_type: "user", target_id: data.user_id });
    return { ok: true };
  });

/* --------------------------- password recovery -------------------------- */

/** Super admin only. Sets a temporary password; the account must change it on next sign-in. */
export const adminResetPasswordForAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ user_id: z.string().uuid(), password: z.string().min(8).max(72) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("profiles").update({ must_change_password: true } as any).eq("id", data.user_id);
    await audit(context, {
      action: "account.temp_password_set",
      target_type: "user",
      target_id: data.user_id,
    });
    return { ok: true };
  });

/** Super admin only. Emails a secure reset link — no password is ever revealed. */
export const adminSendRecoveryLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ user_id: z.string().uuid(), origin: z.string().url().max(300) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: target, error: gErr } = await supabaseAdmin.auth.admin.getUserById(data.user_id);
    if (gErr || !target.user?.email) throw new Error("That account has no email address.");
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(target.user.email, {
      redirectTo: `${data.origin}/reset-password`,
    });
    if (error) throw new Error(error.message);
    await audit(context, {
      action: "account.recovery_link_sent",
      target_type: "user",
      target_id: data.user_id,
    });
    return { ok: true };
  });

/** Super admin only. Rotates the masked reference code and returns the new value once. */
export const adminRotateRecoveryReference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ user_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hint = makeCode();
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ recovery_hint: hint, recovery_hint_set_at: new Date().toISOString() } as any)
      .eq("id", data.user_id);
    if (error) throw new Error(error.message);
    await audit(context, {
      action: "account.recovery_reference_rotated",
      target_type: "user",
      target_id: data.user_id,
    });
    return { ok: true, recovery_reference: hint };
  });

/* ------------------------------- invites ------------------------------ */

export const adminListInvites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("account_invites")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as any[];
  });

export const adminCreateInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        role: z.enum(ROLES),
        email: z.string().trim().email().max(255).optional().or(z.literal("")),
        expires_in_days: z.number().int().min(1).max(90).default(7),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const flags = await assertAdmin(context);
    if ((ELEVATED as readonly string[]).includes(data.role) && !flags.superAdmin)
      throw new Error("Only a super admin can issue admin invites.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = makeCode();
    const expires_at = new Date(Date.now() + data.expires_in_days * 864e5).toISOString();
    // A regular admin's invite is inactive until a super admin approves it.
    const status = flags.superAdmin ? "approved" : "pending";
    const { error } = await supabaseAdmin.from("account_invites").insert({
      code,
      role: data.role,
      email: data.email ? data.email.toLowerCase() : null,
      expires_at,
      created_by: context.userId,
      status,
      approved_by: flags.superAdmin ? context.userId : null,
      approved_at: flags.superAdmin ? new Date().toISOString() : null,
    } as any);
    if (error) throw new Error(error.message);
    await audit(context, {
      action: "invite.created",
      target_type: "invite",
      target_id: code,
      meta: { role: data.role, expires_at, email: data.email || null, status },
    });
    return { code, expires_at, status };
  });

export const adminReviewInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), approve: z.boolean() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const { data: row, error } = await supabaseAdmin
      .from("account_invites")
      .update(
        data.approve
          ? ({ status: "approved", approved_by: context.userId, approved_at: now } as any)
          : ({ status: "rejected", rejected_by: context.userId, rejected_at: now, revoked_at: now } as any),
      )
      .eq("id", data.id)
      .eq("status", "pending")
      .select("code, role, created_by")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("That invite is no longer pending.");
    await audit(context, {
      action: data.approve ? "invite.approved" : "invite.rejected",
      target_type: "invite",
      target_id: data.id,
      meta: { code: (row as any).code, role: (row as any).role, created_by: (row as any).created_by },
    });
    return { ok: true };
  });

export const adminRevokeInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("account_invites")
      .update({ revoked_at: new Date().toISOString() } as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await audit(context, { action: "invite.revoked", target_type: "invite", target_id: data.id });
    return { ok: true };
  });

/* -------------------------- org verifications ------------------------- */

export const adminListOrgApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("org_applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as any[];
  });

export const adminGetOrgDocumentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ path: z.string().max(400) }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("org-docs")
      .createSignedUrl(data.path, 300);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

export const adminReviewOrgApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        approve: z.boolean(),
        note: z.string().max(500).optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: app } = await supabaseAdmin
      .from("org_applications")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!app) throw new Error("Application not found.");

    let orgId: string | null = (app as any).org_id ?? null;

    if (data.approve) {
      const slugBase = String((app as any).org_name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 48);
      const slug = `${slugBase}-${String((app as any).id).slice(0, 6)}`;
      const { data: org, error: orgErr } = await supabaseAdmin
        .from("organisations")
        .insert({
          slug,
          name: (app as any).org_name,
          type: (app as any).org_type,
          website: (app as any).website,
          verified: true,
        } as any)
        .select("id")
        .single();
      if (orgErr) throw new Error(orgErr.message);
      orgId = (org as any).id;
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: (app as any).user_id, role: "org" as any }, { onConflict: "user_id,role" });
    }

    const { error } = await supabaseAdmin
      .from("org_applications")
      .update({
        status: data.approve ? "approved" : "rejected",
        review_note: data.note ?? null,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        org_id: orgId,
      } as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("notifications").insert({
      user_id: (app as any).user_id,
      kind: "system",
      title: data.approve ? "Your organisation was verified." : "Your organisation wasn't verified.",
      body: data.note ?? null,
      link: "/dashboard/org",
    } as any);

    await audit(context, {
      action: data.approve ? "org.approved" : "org.rejected",
      target_type: "org_application",
      target_id: data.id,
      meta: { org_name: (app as any).org_name },
    });

    return { ok: true };
  });

/* ------------------------------ audit log ----------------------------- */

export const adminListAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as any[];
  });
